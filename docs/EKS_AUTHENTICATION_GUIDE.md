# EKS Authentication Configuration Guide

*Comprehensive guide for setting up kubectl authentication with Amazon EKS*

## Authentication Methods Overview

Amazon EKS supports multiple authentication methods depending on your environment and requirements:

### 1. AWS CLI Authentication (Recommended for Development)

**Best for:** Development environments, CI/CD pipelines, direct IAM access

**Setup:**
```bash
aws eks update-kubeconfig --region us-east-2 --name <cluster-name>
```

**How it works:**
- Uses `aws eks get-token` to generate short-lived tokens
- Tokens expire after 15 minutes and are automatically refreshed
- Direct integration with AWS CLI credentials
- No additional binary dependencies

**kubeconfig structure:**
```yaml
users:
- name: arn:aws:eks:us-east-2:ACCOUNT:cluster/CLUSTER-NAME
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
      - --region
      - us-east-2
      - eks
      - get-token
      - --cluster-name
      - CLUSTER-NAME
```

### 2. AWS IAM Authenticator (For Federated Environments)

**Best for:** Enterprise SSO, federated authentication, custom token generators, SAML/OIDC integration

**Setup:**
```bash
# Install aws-iam-authenticator
curl -Lo aws-iam-authenticator "https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v0.6.20/aws-iam-authenticator_0.6.20_linux_amd64"
chmod +x ./aws-iam-authenticator
sudo mv ./aws-iam-authenticator /usr/local/bin/

# Configure kubeconfig
eksctl utils write-kubeconfig --cluster <cluster-name> --region us-east-2
```

**How it works:**
- Uses external binary for token generation
- Supports custom authentication flows
- Can integrate with federated identity providers
- Supports "good until" token assertions for centralized token generation

**kubeconfig structure:**
```yaml
users:
- name: admin@CLUSTER-NAME.us-east-2.eksctl.io
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws-iam-authenticator
      args:
      - token
      - -i
      - CLUSTER-NAME
      env:
      - name: AWS_STS_REGIONAL_ENDPOINTS
        value: regional
```

### 3. OIDC/IRSA (IAM Roles for Service Accounts)

**Best for:** Pod-level authentication, service-to-service auth, workload identity

**Setup:**
```bash
# This is configured at the cluster level and used by pods
# Not for kubectl access
```

## Version Compatibility Matrix

| Component | Version | API Version | Compatible With |
|-----------|---------|-------------|-----------------|
| Kubernetes 1.33 | EKS | `v1beta1`, `v1` | kubectl 1.34+, aws-iam-auth 0.6.20+ |
| Kubernetes 1.32 | EKS | `v1beta1`, `v1` | kubectl 1.33+, aws-iam-auth 0.6.20+ |
| kubectl 1.34+ | Client | `v1beta1`, `v1` | All current EKS versions |
| aws-iam-authenticator 0.6.20+ | Client | `v1beta1` | All current EKS versions |
| aws-iam-authenticator 0.5.x | Client | `v1alpha1` | **INCOMPATIBLE** with K8s 1.30+ |

## Common Version Issues

### Issue: "no kind ExecCredential is registered for version v1alpha1"

**Cause:** Old aws-iam-authenticator (v0.5.x) trying to use deprecated API version

**Solutions:**

1. **Upgrade aws-iam-authenticator:**
```bash
sudo rm -f /usr/local/bin/aws-iam-authenticator
curl -Lo aws-iam-authenticator "https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v0.6.20/aws-iam-authenticator_0.6.20_linux_amd64"
chmod +x ./aws-iam-authenticator
sudo mv ./aws-iam-authenticator /usr/local/bin/
```

2. **Switch to AWS CLI method (recommended):**
```bash
aws eks update-kubeconfig --region us-east-2 --name <cluster-name>
```

### Issue: "the server has asked for the client to provide credentials"

**Cause:** IAM principal not authorized in cluster's RBAC

**Solution:** Add user/role to aws-auth ConfigMap via CDK:
```typescript
cluster.awsAuth.addUserMapping(User.fromUserName(stack, 'AdminUser', 'admin'), {
  groups: ['system:masters'],
});
```

## Enterprise Federation Setup

### SAML Integration

```bash
# 1. Configure SAML identity provider in AWS IAM
aws iam create-saml-provider \
  --name EKSFederatedProvider \
  --saml-metadata-document file://metadata.xml

# 2. Create federated role
aws iam create-role \
  --role-name EKSFederatedRole \
  --assume-role-policy-document file://trust-policy.json

# 3. Configure AWS profile for federation
cat >> ~/.aws/config << EOF
[profile federated]
role_arn = arn:aws:iam::ACCOUNT:role/EKSFederatedRole
source_profile = default
EOF

# 4. Use federated profile
export AWS_PROFILE=federated
aws eks update-kubeconfig --region us-east-2 --name <cluster-name>
```

### Custom Token Generator

For centralized token generation with custom "good until" assertions:

```bash
# aws-iam-authenticator supports custom token server
cat > ~/.aws/iam-authenticator-config.yaml << EOF
clusters:
  - name: my-cluster
    cluster:
      server: https://token-generator.company.com
      certificate-authority-data: <CA_DATA>
EOF

# Use custom config
aws-iam-authenticator token -i my-cluster --config ~/.aws/iam-authenticator-config.yaml
```

## Troubleshooting Commands

### Check Current Authentication

```bash
# View current kubeconfig
kubectl config view --minify

# Check authentication method
kubectl config view --minify | grep -A10 exec

# Test authentication
kubectl auth can-i get pods

# Check token generation
aws eks get-token --cluster-name <cluster-name>
```

### Debug Authentication Issues

```bash
# Enable verbose kubectl logging
kubectl get nodes -v=8

# Check AWS credentials
aws sts get-caller-identity

# Verify cluster access
aws eks describe-cluster --name <cluster-name>

# Check aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml
```

## Cleanup and Resource Management

### Remove Cluster Access from kubeconfig

```bash
# Get cluster ARN for cleanup
CLUSTER_ARN=$(kubectl config current-context)

# Remove cluster configuration
kubectl config delete-cluster "$CLUSTER_ARN"
kubectl config delete-context "$CLUSTER_ARN"
kubectl config delete-user "$CLUSTER_ARN"

# Or clean up all EKS entries
kubectl config get-contexts | grep eks | awk '{print $2}' | xargs -I {} kubectl config delete-context {}
```

### Complete EKS Cleanup

```bash
# 1. Destroy cluster via CDK/CloudFormation
cd /path/to/eks-project
pnpm run cdk destroy

# 2. Verify resource cleanup
aws eks list-clusters
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# 3. Clean up authentication artifacts
rm -f ~/.aws/iam-authenticator-config.yaml
unset AWS_PROFILE  # if using federated profiles

# 4. Remove kubectl cache
rm -rf ~/.kube/cache
```

### Cost Management

```bash
# Monitor EKS-related costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[].Groups[?Keys[0]==`Amazon Elastic Kubernetes Service`]'

# Set up billing alerts (if needed)
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://eks-budget.json
```

## Recommendations by Environment

### Development/Local
- **Use:** AWS CLI authentication
- **Benefits:** Simple, no extra binaries, AWS maintained
- **Setup:** `aws eks update-kubeconfig`

### CI/CD Pipelines
- **Use:** AWS CLI authentication with IAM roles
- **Benefits:** Integrated with AWS SDK, automatic token refresh
- **Setup:** Configure AWS credentials, then `aws eks update-kubeconfig`

### Enterprise/Production
- **Use:** AWS IAM Authenticator with federation
- **Benefits:** SSO integration, centralized identity management
- **Setup:** Configure SAML/OIDC provider, use federated roles

### Multi-Account Access
- **Use:** AWS CLI with cross-account roles
- **Benefits:** Centralized credential management
- **Setup:** Configure assume role profiles

---

*Created: September 29, 2025*
*Last Updated: September 29, 2025*