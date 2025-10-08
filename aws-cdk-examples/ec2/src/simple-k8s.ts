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

        // CNI-specific ports for networking plugins
        // Flannel VXLAN backend communication
        k8sSecurityGroup.addIngressRule(
            k8sSecurityGroup,
            Port.udp(8285),
            'Flannel VXLAN backend'
        );

        // Weave Net ports (alternative CNI)
        k8sSecurityGroup.addIngressRule(
            k8sSecurityGroup,
            Port.tcp(6783),
            'Weave Net control plane'
        );

        k8sSecurityGroup.addIngressRule(
            k8sSecurityGroup,
            Port.udp(6784),
            'Weave Net data plane'
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

            // Configure system for K8s with complete kernel module fix
            'echo "net.bridge.bridge-nf-call-iptables = 1" >> /etc/sysctl.conf',
            'echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.conf',
            'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
            'sysctl --system',

            // Load all required kernel modules for CNI networking
            'modprobe br_netfilter ip_tables iptable_nat iptable_filter',

            // Create permanent kernel module configuration
            'cat > /etc/modules-load.d/k8s.conf << "EOF"',
            'br_netfilter',
            'ip_tables',
            'iptable_nat',
            'iptable_filter',
            'EOF',

            // Create permanent sysctl configuration  
            'cat > /etc/sysctl.d/k8s.conf << "EOF"',
            'net.bridge.bridge-nf-call-ip6tables = 1',
            'net.bridge.bridge-nf-call-iptables = 1',
            'net.ipv4.ip_forward = 1',
            'EOF',

            // Disable swap
            'swapoff -a',
            'sed -i "/swap/d" /etc/fstab',

            // Configure more tolerant liveness probe settings for control plane stability
            'mkdir -p /root/k8s-fixes',
            'cat > /root/k8s-fixes/configure-probes.sh << "EOF"',
            '#!/bin/bash',
            '# Wait for kubeadm init to complete and static pod manifests to exist',
            'while [ ! -f /etc/kubernetes/manifests/etcd.yaml ]; do',
            '  echo "Waiting for Kubernetes manifests..."',
            '  sleep 10',
            'done',
            'sleep 30  # Additional wait for initial startup',
            '',
            '# Make backups',
            'cp /etc/kubernetes/manifests/etcd.yaml /etc/kubernetes/manifests/etcd.yaml.original',
            'cp /etc/kubernetes/manifests/kube-scheduler.yaml /etc/kubernetes/manifests/kube-scheduler.yaml.original',
            'cp /etc/kubernetes/manifests/kube-apiserver.yaml /etc/kubernetes/manifests/kube-apiserver.yaml.original',
            '',
            '# Configure more tolerant liveness probe settings',
            'sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/etcd.yaml',
            'sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/etcd.yaml',
            'sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/etcd.yaml',
            '',
            'sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/kube-scheduler.yaml',
            'sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/kube-scheduler.yaml',
            'sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/kube-scheduler.yaml',
            '',
            'sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/kube-apiserver.yaml',
            'sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/kube-apiserver.yaml',
            'sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/kube-apiserver.yaml',
            '',
            'echo "Liveness probe configuration completed"',
            'systemctl restart kubelet',
            'EOF',
            'chmod +x /root/k8s-fixes/configure-probes.sh',
            '',
            '# Create systemd service to run probe configuration after kubeadm init',
            'cat > /etc/systemd/system/k8s-probe-config.service << "EOF"',
            '[Unit]',
            'Description=Configure Kubernetes Liveness Probes',
            'After=kubelet.service',
            'Wants=kubelet.service',
            '',
            '[Service]',
            'Type=oneshot',
            'ExecStart=/root/k8s-fixes/configure-probes.sh',
            'RemainAfterExit=true',
            '',
            '[Install]',
            'WantedBy=multi-user.target',
            'EOF',
            '',
            '# Enable the service but don\'t start it yet (will be triggered after kubeadm init)',
            'systemctl enable k8s-probe-config.service',

            // Create simple instructions file
            'cat > /home/ec2-user/k8s-training.txt << "EOF"',
            '=== Linux Foundation Kubernetes Training ===',
            '',
            'Ready for manual K8s setup! No automation - practice the commands.',
            '',
            'PRE-FLIGHT CHECK (verify kernel modules):',
            'lsmod | grep -E "(br_netfilter|ip_tables|iptable_nat|iptable_filter)"',
            '# Should show all 4 modules loaded',
            '',
            'CONTROL PLANE SETUP:',
            'sudo kubeadm init --pod-network-cidr=10.244.0.0/16',
            'mkdir -p $HOME/.kube',
            'sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config',
            'sudo chown $(id -u):$(id -g) $HOME/.kube/config',
            '',
            'APPLY LIVENESS PROBE FIX (if control plane unstable):',
            'sudo systemctl start k8s-probe-config.service',
            '# This configures more tolerant liveness probe settings',
            '# to prevent restart loops during cluster initialization',
            '',
            'POD NETWORK (Flannel - recommended):',
            'kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml',
            '',
            'ALTERNATIVE CNI (Weave):',
            'kubectl apply -f https://reweave.azurewebsites.net/k8s/v1.28/net.yaml',
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
        new CfnOutput(this, 'SecurityGroupId', {
            value: k8sSecurityGroup.securityGroupId,
            description: 'Security Group ID for Kubernetes cluster',
        });

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