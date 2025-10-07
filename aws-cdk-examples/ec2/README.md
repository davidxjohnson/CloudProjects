# EC2 Kubernetes Cluster Setup

This CDK project creates the infrastructure for a manual Kubernetes cluster setup with two EC2 instances: one control plane and one worker node.

## Architecture

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **EC2 Instances**: 2x t3.large (2 vCPU, 8GB RAM each) in private subnets
- **Security Group**: Allows Kubernetes inter-node communication and API access
- **NAT Gateway**: Provides outbound internet access for private instances
- **VPC Endpoints**: SSM, SSM Messages, and EC2 Messages for Session Manager
- **SSM Agent**: Pre-installed and configured for secure access

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **CDK CLI installed** (v2.219.0 or later)
3. **Session Manager plugin installed**:
   ```bash
   # On Linux/WSL
   curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
   sudo dpkg -i session-manager-plugin.deb
   ```

## Deployment

1. **Install dependencies**:
   ```bash
   cd aws-cdk-examples/ec2
   pnpm install
   ```

2. **Build the project**:
   ```bash
   pnpm run build
   ```

3. **Deploy the stack**:
   ```bash
   pnpm run deploy
   ```

## Instance Configuration

The user data script automatically installs:
- Docker CE
- containerd (configured for Kubernetes)
- kubeadm, kubelet, kubectl (v1.28)
- Required kernel modules and system settings

## Post-Deployment Kubernetes Setup

## Instance Access

Instances are accessed via **AWS Session Manager** - no SSH keys required!

**Important**: Wait 2-3 minutes after deployment for the SSM agent to register.

### Connect to Control Plane:
```bash
aws ssm start-session --target <control-plane-instance-id>
```

### Connect to Worker Node:
```bash
aws ssm start-session --target <worker-instance-id>
```

Instance IDs will be provided in the deployment output.

### 2. Initialize Kubernetes Control Plane

```bash
# On the control plane instance
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Set up kubectl for ec2-user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 3. Install Pod Network (Flannel)

```bash
# On the control plane instance
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### 4. Get Join Command

```bash
# On the control plane instance
kubeadm token create --print-join-command
```

### 5. Join Worker Node

```bash
# Connect to worker node instance
aws ssm start-session --target <worker-instance-id>

# Run the join command from step 4 (example):
sudo kubeadm join <control-plane-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

### 6. Verify Cluster

```bash
# On the control plane instance
kubectl get nodes
kubectl get pods --all-namespaces
```

## Instance Specifications

- **Instance Type**: t3.large
- **vCPUs**: 2
- **Memory**: 8GB RAM
- **Storage**: 8GB gp3 EBS (default)
- **OS**: Amazon Linux 2023
- **Network**: Private subnets with NAT Gateway

## Security Group Rules

- **Kubernetes API (6443)**: Allowed from anywhere
- **All Traffic**: Allowed between instances in the security group
- **Outbound**: All traffic allowed
- **SSH**: Not needed - using Session Manager

## Costs

Estimated monthly costs (us-east-1):
- 2x t3.large instances: ~$120/month
- NAT Gateway: ~$45/month
- EBS storage: ~$2/month
- **Total**: ~$167/month

## Cleanup

```bash
pnpm run destroy
```

## Troubleshooting

### Session Manager Connection Issues

**"TargetNotConnected" Error:**
1. **Check SSM Agent Status**: Wait 2-3 minutes after deployment for SSM agent to register
2. **Verify Plugin Installation**: Ensure Session Manager plugin is installed locally
   ```bash
   session-manager-plugin --version
   ```
3. **Check Instance Registration**: 
   ```bash
   aws ssm describe-instance-information --filters "Key=InstanceIds,Values=<instance-id>"
   ```

**Session Manager Plugin Installation:**
```bash
# Ubuntu/WSL
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
sudo dpkg -i session-manager-plugin.deb

# macOS
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/session-manager-plugin.pkg" -o "session-manager-plugin.pkg"
sudo installer -pkg session-manager-plugin.pkg -target /
```

### Instance Access Issues
1. Ensure Session Manager is configured
2. Check security group rules
3. Verify instance is in Running state

### Kubernetes Setup Issues
1. Check instance logs: `sudo journalctl -u kubelet`
2. Verify Docker is running: `sudo systemctl status docker`
3. Check containerd: `sudo systemctl status containerd`

### Network Issues
1. Verify all security group rules
2. Check route tables for private subnets
3. Confirm NAT Gateway is operational

## Customization

You can customize the deployment by modifying `cdk.json`:

```json
{
  "context": {
    "instanceType": "t3.medium",
    "maxAzs": 2
  }
}
```