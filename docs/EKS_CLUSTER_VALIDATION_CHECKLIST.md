git status# EKS Cluster Validation Checklist

*Morning startup guide for testing real EKS infrastructure*

## Prerequisites Setup

### 1. Install Required Tools

#### Install kubectl
```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

#### Install eksctl
```bash
# Linux x64
ARCH=amd64
PLATFORM=$(uname -s)_$ARCH
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"
tar -xzf eksctl_$PLATFORM.tar.gz -C /tmp && rm eksctl_$PLATFORM.tar.gz
sudo mv /tmp/eksctl /usr/local/bin

# Verify installation
eksctl version
```

#### Install AWS CLI v2 (if not already installed)
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 2. AWS Configuration Check
```bash
# Verify AWS credentials are configured
aws sts get-caller-identity

# Check region configuration
aws configure get region

# If not configured:
aws configure
# Enter: Access Key, Secret Key, Region (e.g., us-east-1), Output format (json)
```

## EKS Cluster Deployment

### 1. Review CDK Code
```bash
cd /home/dxj/TypescriptProjects/CloudProjects/aws-cdk-examples/eks

# Check what's currently configured
cat src/index.ts
cat cdk.json
```

### 2. Deploy EKS Cluster

#### Pre-deployment Version Check
```bash
# Ensure client tools are compatible with target Kubernetes version
kubectl version --client --short
eksctl version

# Check CDK configuration for Kubernetes version
cat cdk.json | grep -A5 -B5 k8sVersion
```

#### Deployment Steps
```bash
# Install dependencies
pnpm install

# Bootstrap CDK (if first time in region)
pnpm run cdk bootstrap

# Review what will be created (check for version compatibility)
pnpm run cdk diff

# Deploy the cluster (this takes 15-20 minutes)
pnpm run cdk deploy
```

#### Post-deployment Verification
```bash
# Verify cluster version matches expected
aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.version'

# Verify node group AMI type is compatible with Kubernetes version
aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --query 'nodegroups[0]' --output text) --query 'nodegroup.amiType'
```

### 3. Monitor Deployment Progress
```bash
# Watch CloudFormation stack progress
aws cloudformation describe-stacks --stack-name EksStack --query 'Stacks[0].StackStatus'

# Or use AWS Console:
# https://console.aws.amazon.com/cloudformation/
```

## Cluster Validation

### 1. Configure kubectl for EKS

#### Authentication Method Selection

**Choose the appropriate authentication method based on your environment:**

##### Option A: AWS CLI Method (Recommended for Development)
```bash
# Best for: Development, direct IAM access, simple setups
# Get cluster name from CDK output or CloudFormation
CLUSTER_NAME=$(aws eks list-clusters --query 'clusters[0]' --output text)
echo "Cluster name: $CLUSTER_NAME"

# Update kubeconfig using AWS CLI
aws eks update-kubeconfig --region $(aws configure get region) --name $CLUSTER_NAME

# This creates kubeconfig entries using:
# - command: aws
# - args: [--region, us-east-2, eks, get-token, --cluster-name, CLUSTER_NAME]
# - apiVersion: client.authentication.k8s.io/v1beta1
```

##### Option B: AWS IAM Authenticator Method (For Federated Environments)
```bash
# Best for: Enterprise SSO, federated auth, custom token generators
# Install aws-iam-authenticator first
curl -Lo aws-iam-authenticator "https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v0.6.20/aws-iam-authenticator_0.6.20_linux_amd64"
chmod +x ./aws-iam-authenticator
sudo mv ./aws-iam-authenticator /usr/local/bin/

# Configure using eksctl
eksctl utils write-kubeconfig --cluster $CLUSTER_NAME --region $(aws configure get region)

# This creates kubeconfig entries using:
# - command: aws-iam-authenticator
# - args: [token, -i, CLUSTER_NAME]
# - apiVersion: client.authentication.k8s.io/v1beta1
```

#### Authentication Method Comparison

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| AWS CLI | Development, CI/CD, Simple IAM | No extra binaries, AWS maintained, modern | No federation support |
| IAM Authenticator | Enterprise SSO, Federated auth | Federation support, Custom tokens | Extra binary, Version compatibility |
| OIDC/IRSA | Pod workloads, Service accounts | No long-lived creds | Limited to pod-level auth |

#### Version Compatibility Requirements

**Critical:** Ensure client and server API versions match:

```bash
# Check kubectl version
kubectl version --client --output=yaml

# Check cluster Kubernetes version
aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.version'

# Verify authentication API version compatibility
kubectl config view --minify | grep apiVersion
```

**Version Matrix:**
- **Kubernetes 1.33**: Requires `client.authentication.k8s.io/v1beta1` or later
- **kubectl 1.34+**: Supports `v1beta1` and `v1`
- **aws-iam-authenticator v0.6.20+**: Supports `v1beta1`
- **aws-iam-authenticator v0.5.x**: Only supports `v1alpha1` (incompatible)

**Version Mismatch Troubleshooting:**
```bash
# If you see "no kind ExecCredential is registered for version v1alpha1"
# You need to either:
# 1. Upgrade aws-iam-authenticator to v0.6.20+, OR
# 2. Switch to AWS CLI authentication method

# Quick fix - switch to AWS CLI method:
aws eks update-kubeconfig --region $(aws configure get region) --name $CLUSTER_NAME
```

### 2. Test Basic Kubernetes Functionality
```bash
# Check node status
kubectl get nodes -o wide

# Check system pods
kubectl get pods -n kube-system

# Check cluster info
kubectl get namespaces
```

## list-pods Application Testing

### 1. Deploy Test Workload (Optional)
```bash
# Create a test deployment to have some pods to list
kubectl create deployment nginx-test --image=nginx:latest --replicas=3

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=nginx-test --timeout=300s

# Verify pods are running
kubectl get pods -l app=nginx-test
```

### 2. Run list-pods Against Real EKS
```bash
cd /home/dxj/TypescriptProjects/CloudProjects/aws-sdk-examples/list-pods

# Ensure dependencies are installed
pnpm install

# Build the application
pnpm run build

# Run against real EKS cluster
pnpm start

# Or run directly with node
node dist/list-pods.js
```

### 3. Compare with Mocked Results
```bash
# Run tests to see mocked behavior
pnpm test

# Run coverage to ensure tests are comprehensive
pnpm run test:coverage
```

## Validation Checklist

### ✅ Infrastructure Validation
- [ ] kubectl installed and working
- [ ] eksctl installed and working
- [ ] AWS credentials configured and valid
- [ ] EKS cluster deployed successfully
- [ ] kubectl can connect to cluster
- [ ] Cluster nodes are in Ready state

### ✅ Application Validation
- [ ] list-pods builds successfully
- [ ] Application connects to real EKS cluster
- [ ] Real pods are listed (not mocked data)
- [ ] Application handles real AWS API responses
- [ ] Error handling works with real network conditions

### ✅ Test Suite Validation
- [ ] Unit tests still pass after infrastructure testing
- [ ] Mocked tests accurately reflect real API behavior
- [ ] No discrepancies between mocked and real responses
- [ ] Test coverage remains high

## Troubleshooting Common Issues

### EKS Cluster Issues
```bash
# If cluster creation fails
pnpm run cdk destroy
# Check CloudFormation events for errors
aws cloudformation describe-stack-events --stack-name EksStack

# If kubectl can't connect
aws eks describe-cluster --name $CLUSTER_NAME
aws eks update-kubeconfig --name $CLUSTER_NAME --region $(aws configure get region)
```

## Troubleshooting Common Issues

### EKS Cluster Issues
```bash
# If cluster creation fails
pnpm run cdk destroy
# Check CloudFormation events for errors
aws cloudformation describe-stack-events --stack-name EksStack

# If kubectl can't connect
aws eks describe-cluster --name $CLUSTER_NAME
aws eks update-kubeconfig --name $CLUSTER_NAME --region $(aws configure get region)
```

### Authentication Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check kubectl auth
kubectl auth can-i get pods

# If permission denied, check IAM roles and policies
```

#### Version Compatibility Issues
```bash
# Error: "no kind ExecCredential is registered for version v1alpha1"
# Solution 1: Update aws-iam-authenticator
curl -Lo aws-iam-authenticator "https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v0.6.20/aws-iam-authenticator_0.6.20_linux_amd64"
chmod +x ./aws-iam-authenticator
sudo mv ./aws-iam-authenticator /usr/local/bin/

# Solution 2: Switch to AWS CLI authentication (recommended)
aws eks update-kubeconfig --region $(aws configure get region) --name $CLUSTER_NAME

# Verify fixed configuration
kubectl config view --minify | grep -A5 exec
```

#### RBAC Access Issues
```bash
# If "server has asked for the client to provide credentials"
# Check if your IAM user/role is in the cluster's aws-auth ConfigMap

# View current aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml

# If your user isn't listed, you need to add it via CDK:
# cluster.awsAuth.addUserMapping(User.fromUserName(stack, 'AdminUser', 'admin'), {
#   groups: ['system:masters'],
# });
```

#### Cleanup Issues
```bash
# If CDK destroy fails due to dependencies
# Force delete CloudFormation stack (use with caution)
aws cloudformation delete-stack --stack-name EksStack

# If nodes won't terminate
# Check for stuck pods or persistent volumes
kubectl get pods --all-namespaces
kubectl get pv

# Manually delete node groups if needed
NODE_GROUP=$(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --query 'nodegroups[0]' --output text)
aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP

# Wait for node group deletion before retrying CDK destroy
aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP --query 'nodegroup.status'
```

#### Resource Cleanup Verification
```bash
# Comprehensive cleanup check
echo "=== Resource Cleanup Verification ==="

# Check EKS clusters
echo "EKS Clusters:"
aws eks list-clusters --query 'clusters'

# Check CloudFormation stacks
echo "CloudFormation Stacks:"
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE DELETE_FAILED ROLLBACK_COMPLETE --query 'StackSummaries[?contains(StackName, `Eks`)].[StackName,StackStatus]' --output table

# Check EC2 instances (should show none from EKS)
echo "EC2 Instances from EKS:"
aws ec2 describe-instances --filters "Name=tag:kubernetes.io/cluster/*,Values=owned" --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' --output table

# Check VPCs created by CDK
echo "VPCs from CDK:"
aws ec2 describe-vpcs --filters "Name=tag:aws:cloudformation:stack-name,Values=EksStack" --query 'Vpcs[].[VpcId,State,Tags[?Key==`Name`].Value|[0]]' --output table

# Check NAT Gateways (can be expensive if left running)
echo "NAT Gateways:"
aws ec2 describe-nat-gateways --filter "Name=tag:aws:cloudformation:stack-name,Values=EksStack" --query 'NatGateways[].[NatGatewayId,State]' --output table

# Check Load Balancers
echo "Load Balancers:"
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].[LoadBalancerName,State.Code]' --output table
```

### list-pods Application Issues
```bash
# Check AWS SDK configuration
export AWS_REGION=$(aws configure get region)
export AWS_PROFILE=default

# Debug with verbose logging
node --inspect dist/list-pods.js

# Check if kubeconfig is accessible to the application
echo $KUBECONFIG
ls -la ~/.kube/config
```

## Expected Outcomes

### Success Indicators
1. **EKS cluster deploys** within 15-20 minutes
2. **kubectl commands work** and show real nodes
3. **list-pods application** connects to real cluster and lists actual pods
4. **No mocked data** appears in real cluster output
5. **Application performance** is reasonable (not just instant mock responses)

### Performance Comparison
- **Mocked tests**: Instant responses, predictable data
- **Real EKS**: Network latency, real authentication, actual pod data
- **This difference validates** that your mocks are working correctly

## Cost Management

### Monitor AWS Costs
```bash
# Check current costs
aws ce get-cost-and-usage --time-period Start=2025-09-29,End=2025-09-30 --granularity DAILY --metrics BlendedCost

# EKS cluster costs roughly $0.10/hour + EC2 node costs
# Remember to destroy when done testing
```

### Cleanup After Testing
```bash
# Destroy EKS cluster to avoid charges
cd /home/dxj/TypescriptProjects/CloudProjects/aws-cdk-examples/eks
pnpm run cdk destroy

# Verify cluster deletion
aws eks list-clusters --region $(aws configure get region)

# Check CloudFormation stack is deleted
aws cloudformation describe-stacks --stack-name EksStack --region $(aws configure get region) --query 'Stacks[0].StackStatus' 2>/dev/null || echo "Stack deleted"

# Clean up kubeconfig entries (optional)
CLUSTER_ARN="arn:aws:eks:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):cluster/EksClusterFAB68BDB-7cd9e8dc689c4f238cbc95330a543164"
kubectl config delete-cluster "$CLUSTER_ARN" 2>/dev/null || true
kubectl config delete-context "$CLUSTER_ARN" 2>/dev/null || true
kubectl config delete-user "$CLUSTER_ARN" 2>/dev/null || true

# Verify no remaining AWS resources
echo "=== Cleanup Verification ==="
echo "Clusters remaining: $(aws eks list-clusters --query 'clusters | length')"
echo "CloudFormation stacks: $(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?StackName==`EksStack`] | length')"
```

#### Cost Monitoring During Testing
```bash
# Check current costs (requires billing access)
aws ce get-cost-and-usage \
  --time-period Start=$(date -d 'yesterday' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[?Keys[0]==`Amazon Elastic Kubernetes Service` || Keys[0]==`Amazon Elastic Compute Cloud - Compute`]'

# Estimated costs:
# - EKS cluster: ~$0.10/hour
# - 2x m5.large nodes: ~$0.192/hour
# - Total: ~$0.29/hour or ~$7/day
```

## Next Steps After Validation

### If Everything Works
- [ ] Update documentation with real-world validation results
- [ ] Add integration test category for real infrastructure testing
- [ ] Consider adding real EKS testing to CI/CD pipeline (expensive)

### If Issues Found
- [ ] Update mocks to better reflect real API behavior
- [ ] Fix any discrepancies between mocked and real responses
- [ ] Enhance error handling based on real-world scenarios

---

*Created: September 29, 2025*
*Expected execution time: 30-45 minutes (including 15-20 min cluster deployment)*