import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import {
    Vpc,
    SubnetType,
    Instance,
    InstanceType,
    InstanceClass,
    InstanceSize,
    MachineImage,
    SecurityGroup,
    Port,
    Peer,
    UserData,
    InterfaceVpcEndpoint,
    InterfaceVpcEndpointAwsService
} from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';/**
 * EC2 Stack for Kubernetes Control Plane and Worker Node
 * 
 * This stack creates:
 * - VPC with public and private subnets
 * - Security group allowing inter-node communication
 * - Two EC2 instances (t3.large = 2 vCPU, 8GB RAM each) in private subnets
 * - NAT Gateway for outbound internet access from private subnets
 * - AWS Session Manager for secure access (no SSH keys needed)
 * 
 * Instance Specifications:
 * - Instance Type: t3.large (2 vCPU, 8GB RAM)
 * - OS: Amazon Linux 2023 (optimized for Kubernetes)
 * - Network: Private subnets with NAT Gateway for internet access
 * - Access: AWS Session Manager (no SSH keys required)
 * 
 * Post-deployment setup:
 * 1. Connect via AWS Session Manager
 * 2. Initialize Kubernetes control plane
 * 3. Join worker node to the cluster
 * 4. Install pod network (Flannel/Calico)
 */

export interface Ec2StackProps extends StackProps {
    instanceType?: InstanceType;
}

export class Ec2Stack extends Stack {
    constructor(scope: App, id: string, props?: Ec2StackProps) {
        super(scope, id, props);

        // Use instance type from props or default to t3.large (2 vCPU, 8GB RAM)
        // Note: t3.medium only has 4GB RAM, t3.large has 8GB as requested
        const instanceType = props?.instanceType || InstanceType.of(InstanceClass.T3, InstanceSize.LARGE);

        // Create VPC with public and private subnets
        const vpc = new Vpc(this, 'K8sVpc', {
            maxAzs: 2,
            natGateways: 1, // Shared NAT Gateway for cost optimization
            subnetConfiguration: [
                {
                    name: 'Public',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24,
                },
                {
                    name: 'Private',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24,
                },
            ],
        });

        // Create a security group for Kubernetes nodes
        const k8sSecurityGroup = new SecurityGroup(this, 'K8sSecurityGroup', {
            vpc,
            description: 'Security group for Kubernetes control plane and worker nodes',
            allowAllOutbound: true,
        });

        // Note: SSH not needed - using AWS Session Manager for access

        // Allow all traffic between instances in the security group (for Kubernetes communication)
        k8sSecurityGroup.addIngressRule(
            k8sSecurityGroup,
            Port.allTraffic(),
            'All traffic between Kubernetes nodes'
        );

        // Kubernetes API server port (for external access if needed)
        k8sSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(6443),
            'Kubernetes API server'
        );

        // User data script for initial setup
        const userData = UserData.forLinux();
        userData.addCommands(
            // Update system
            'dnf update -y',

            // Install required packages
            'dnf install -y curl wget iproute-tc',

            // Install and start SSM agent for Session Manager
            'dnf install -y amazon-ssm-agent',
            'systemctl enable amazon-ssm-agent',
            'systemctl start amazon-ssm-agent',

            // Install Docker (required for Kubernetes)
            'dnf install -y docker',
            'systemctl enable docker',
            'systemctl start docker',
            'usermod -aG docker ec2-user',

            // Configure containerd for Kubernetes
            'dnf install -y containerd',
            'mkdir -p /etc/containerd',
            'containerd config default | tee /etc/containerd/config.toml',
            'sed -i "s/SystemdCgroup = false/SystemdCgroup = true/g" /etc/containerd/config.toml',
            'systemctl enable containerd',
            'systemctl start containerd',

            // Install Kubernetes packages
            'cat <<EOF | tee /etc/yum.repos.d/kubernetes.repo',
            '[kubernetes]',
            'name=Kubernetes',
            'baseurl=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/',
            'enabled=1',
            'gpgcheck=1',
            'gpgkey=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/repodata/repomd.xml.key',
            'EOF',
            'dnf install -y kubelet kubeadm kubectl --disableexcludes=kubernetes',
            'systemctl enable kubelet',

            // Configure system settings for Kubernetes
            'echo "net.bridge.bridge-nf-call-iptables = 1" >> /etc/sysctl.conf',
            'echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.conf',
            'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
            'sysctl --system',

            // Load br_netfilter module
            'modprobe br_netfilter',
            'echo "br_netfilter" >> /etc/modules-load.d/k8s.conf',

            // Disable swap (required for Kubernetes)
            'swapoff -a',
            'sed -i "/swap/d" /etc/fstab',

            // Create setup scripts directory
            'mkdir -p /home/ec2-user/k8s-setup',
            'chown ec2-user:ec2-user /home/ec2-user/k8s-setup'
        );

        // Create Kubernetes Control Plane instance
        const controlPlaneInstance = new Instance(this, 'K8sControlPlane', {
            instanceType: instanceType,
            machineImage: MachineImage.latestAmazonLinux2023(),
            vpc: vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: k8sSecurityGroup,
            userData: userData,
            userDataCausesReplacement: true,
        });

        // Add Session Manager permissions to control plane
        controlPlaneInstance.role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        // Add tags to identify the control plane
        controlPlaneInstance.node.addMetadata('Role', 'ControlPlane');

        // Create Kubernetes Worker Node instance
        const workerInstance = new Instance(this, 'K8sWorkerNode', {
            instanceType: instanceType,
            machineImage: MachineImage.latestAmazonLinux2023(),
            vpc: vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: k8sSecurityGroup,
            userData: userData,
            userDataCausesReplacement: true,
        });

        // Add Session Manager permissions to worker node
        workerInstance.role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        // Add tags to identify the worker node
        workerInstance.node.addMetadata('Role', 'WorkerNode');

        // VPC Endpoints for Session Manager in private subnets
        new InterfaceVpcEndpoint(this, 'SSMEndpoint', {
            vpc,
            service: InterfaceVpcEndpointAwsService.SSM,
            subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        });

        new InterfaceVpcEndpoint(this, 'SSMMessagesEndpoint', {
            vpc,
            service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        });

        new InterfaceVpcEndpoint(this, 'EC2MessagesEndpoint', {
            vpc,
            service: InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        });

        // Outputs
        new CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'VPC ID for the Kubernetes cluster',
        });

        new CfnOutput(this, 'ControlPlaneInstanceId', {
            value: controlPlaneInstance.instanceId,
            description: 'Instance ID of the Kubernetes control plane',
        });

        new CfnOutput(this, 'ControlPlanePrivateIp', {
            value: controlPlaneInstance.instancePrivateIp,
            description: 'Private IP address of the Kubernetes control plane',
        });

        new CfnOutput(this, 'WorkerNodeInstanceId', {
            value: workerInstance.instanceId,
            description: 'Instance ID of the Kubernetes worker node',
        });

        new CfnOutput(this, 'WorkerNodePrivateIp', {
            value: workerInstance.instancePrivateIp,
            description: 'Private IP address of the Kubernetes worker node',
        });

        new CfnOutput(this, 'SecurityGroupId', {
            value: k8sSecurityGroup.securityGroupId,
            description: 'Security Group ID for the Kubernetes cluster',
        });

        new CfnOutput(this, 'SSMConnectControlPlane', {
            value: `aws ssm start-session --target ${controlPlaneInstance.instanceId}`,
            description: 'AWS SSM command to connect to control plane',
        });

        new CfnOutput(this, 'SSMConnectWorker', {
            value: `aws ssm start-session --target ${workerInstance.instanceId}`,
            description: 'AWS SSM command to connect to worker node',
        });
    }
}

// Create the app and stack
const app = new App();
new Ec2Stack(app, 'Ec2Stack', {
    instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.LARGE), // 2 vCPU, 8GB RAM
});

app.synth();