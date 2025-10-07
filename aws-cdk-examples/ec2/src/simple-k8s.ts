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
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

/**
 * Simple EC2 Stack for Linux Foundation Kubernetes Training
 * 
 * This creates bare-minimum EC2 instances with Kubernetes tools installed.
 * No automation, no scripts - just practice manual K8s setup for CKA/CKAD.
 */

export interface SimpleK8sStackProps extends StackProps {
    instanceType?: InstanceType;
}

export class SimpleK8sStack extends Stack {
    constructor(scope: App, id: string, props?: SimpleK8sStackProps) {
        super(scope, id, props);

        // Use t3.large (2 vCPU, 8GB RAM) for K8s training
        const instanceType = props?.instanceType || InstanceType.of(InstanceClass.T3, InstanceSize.LARGE);

        // Create VPC with public and private subnets
        const vpc = new Vpc(this, 'K8sVpc', {
            maxAzs: 2,
            natGateways: 1,
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

        // Security group for K8s nodes
        const k8sSecurityGroup = new SecurityGroup(this, 'K8sSecurityGroup', {
            vpc,
            description: 'Security group for Kubernetes training nodes',
            allowAllOutbound: true,
        });

        // Allow all traffic between K8s nodes
        k8sSecurityGroup.addIngressRule(
            k8sSecurityGroup,
            Port.allTraffic(),
            'All traffic between Kubernetes nodes'
        );

        // Kubernetes API server port
        k8sSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(6443),
            'Kubernetes API server'
        );

        // User data script - minimal setup for K8s training
        const userData = UserData.forLinux();
        userData.addCommands(
            // Update system
            'dnf update -y',

            // Install basic packages and networking tools
            'dnf install -y curl wget iproute-tc',

            // Session Manager for access
            'dnf install -y amazon-ssm-agent',
            'systemctl enable amazon-ssm-agent',
            'systemctl start amazon-ssm-agent',

            // Container runtime
            'dnf install -y docker containerd',
            'systemctl enable docker containerd',
            'systemctl start docker containerd',
            'usermod -aG docker ec2-user',

            // Configure containerd for K8s
            'mkdir -p /etc/containerd',
            'containerd config default | tee /etc/containerd/config.toml',
            'sed -i "s/SystemdCgroup = false/SystemdCgroup = true/g" /etc/containerd/config.toml',
            'systemctl restart containerd',

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

            // Ensure networking tools are available
            'ln -sf /usr/sbin/tc /usr/bin/tc',
            'echo "export PATH=/usr/sbin:/sbin:$PATH" >> /etc/environment',

            // Configure system for K8s
            'echo "net.bridge.bridge-nf-call-iptables = 1" >> /etc/sysctl.conf',
            'echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.conf',
            'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
            'sysctl --system',
            'modprobe br_netfilter',
            'echo "br_netfilter" >> /etc/modules-load.d/k8s.conf',

            // Disable swap
            'swapoff -a',
            'sed -i "/swap/d" /etc/fstab',

            // Create simple instructions file
            'cat > /home/ec2-user/k8s-training.txt << "EOF"',
            '=== Linux Foundation Kubernetes Training ===',
            '',
            'Ready for manual K8s setup! No automation - practice the commands.',
            '',
            'CONTROL PLANE SETUP:',
            'sudo kubeadm init --pod-network-cidr=10.244.0.0/16',
            'mkdir -p $HOME/.kube',
            'sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config',
            'sudo chown $(id -u):$(id -g) $HOME/.kube/config',
            '',
            'POD NETWORK (Flannel):',
            'kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml',
            '',
            'WORKER NODE:',
            '# Copy the kubeadm join command from control plane init output',
            '',
            'VERIFY:',
            'kubectl get nodes',
            'kubectl get pods --all-namespaces',
            '',
            'Good luck with CKA/CKAD training!',
            'EOF',
            'chown ec2-user:ec2-user /home/ec2-user/k8s-training.txt'
        );

        // VPC Endpoints for Session Manager
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

        // Control Plane Instance
        const controlPlane = new Instance(this, 'K8sControlPlane', {
            instanceType: instanceType,
            machineImage: MachineImage.latestAmazonLinux2023(),
            vpc: vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: k8sSecurityGroup,
            userData: userData,
            userDataCausesReplacement: true,
        });

        controlPlane.role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        // Worker Node Instance
        const workerNode = new Instance(this, 'K8sWorkerNode', {
            instanceType: instanceType,
            machineImage: MachineImage.latestAmazonLinux2023(),
            vpc: vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: k8sSecurityGroup,
            userData: userData,
            userDataCausesReplacement: true,
        });

        workerNode.role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        // Outputs
        new CfnOutput(this, 'ControlPlaneInstanceId', {
            value: controlPlane.instanceId,
            description: 'Control Plane Instance ID',
        });

        new CfnOutput(this, 'WorkerNodeInstanceId', {
            value: workerNode.instanceId,
            description: 'Worker Node Instance ID',
        });

        new CfnOutput(this, 'SSMConnectControlPlane', {
            value: `aws ssm start-session --target ${controlPlane.instanceId}`,
            description: 'Connect to control plane via Session Manager',
        });

        new CfnOutput(this, 'SSMConnectWorker', {
            value: `aws ssm start-session --target ${workerNode.instanceId}`,
            description: 'Connect to worker node via Session Manager',
        });
    }
}

// Create the app and stack
const app = new App();
new SimpleK8sStack(app, 'SimpleK8sStack');