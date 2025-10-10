# Complete Manual-to-CDK Migration Workflow

This document explains the complete workflow for your approach: building AWS resources manually, then migrating them to infrastructure-as-code.

## Overview of Your Approach

1. **Manual Build** → Hand-build EC2 instances and security group  
2. **CDK Migration** → Import manual resources into infrastructure-as-code
3. **Enhanced Management** → Add CloudWatch monitoring and other CDK-managed features

## Phase 1: Manual Infrastructure Build

### **Step 1: Use the Manual Build Guide**
```bash
# Follow the comprehensive manual build guide
cat docs/MANUAL_K8S_BUILD_GUIDE.md

# Build these resources by hand in AWS Console:
# - Security group with 11 specific rules
# - Controller EC2 instance (t3.large)  
# - Worker EC2 instance (t3.large)
# - Manual Kubernetes cluster setup
```

### **Step 2: Document Your Manual Resources**
Once built, collect these details:
```bash
# Security Group ID
aws ec2 describe-security-groups --filters "Name=group-name,Values=k8s-manual-sg" \
  --query 'SecurityGroups[0].GroupId' --output text

# Controller Instance ID
aws ec2 describe-instances --filters "Name=tag:Name,Values=k8s-controller-manual" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text

# Worker Instance ID  
aws ec2 describe-instances --filters "Name=tag:Name,Values=k8s-worker-manual" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text

# VPC ID (if not using default)
aws ec2 describe-vpcs --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' --output text

# Availability Zone
aws ec2 describe-instances --filters "Name=tag:Name,Values=k8s-controller-manual" \
  --query 'Reservations[0].Instances[0].Placement.AvailabilityZone' --output text
```

## Phase 2: CDK Migration Setup

### **Step 1: Choose Migration Stack**
You have two CDK stacks available:

#### **Option A: ec2-migrate-stack.ts (Creation-focused)**
- Creates new resources similar to your manual build
- Good for: Creating parallel infrastructure or starting fresh

#### **Option B: ec2-migration-stack.ts (Import-focused) ← RECOMMENDED**
- References existing manual resources
- Adds CloudWatch monitoring and other enhancements
- Good for: True migration of existing resources

### **Step 2: Update Migration Configuration**
Edit the chosen stack file:
```typescript
// In lib/ec2-migration-stack.ts
const MANUAL_RESOURCES = {
    securityGroupId: 'sg-1234567890abcdef0',      // Your actual SG ID
    controllerInstanceId: 'i-1234567890abcdef0',   // Your actual controller ID  
    workerInstanceId: 'i-0987654321fedcba0',       // Your actual worker ID
    vpcId: 'vpc-12345678',                         // Your actual VPC ID (or keep default)
    availabilityZone: 'us-east-2a',                // Your actual AZ
};
```

### **Step 3: Deploy Migration Stack**
```bash
cd aws-cdk-examples/ec2-migrate
pnpm install

# First, synthesize to check configuration
pnpm run cdk synth

# Deploy the migration stack (creates monitoring, references existing resources)
pnpm run cdk deploy Ec2MigrationStack
```

## Phase 3: Verify Migration

### **Step 1: Check CDK Outputs**
```bash
# Get CloudFormation outputs
aws cloudformation describe-stacks --stack-name Ec2MigrationStack \
  --query 'Stacks[0].Outputs'

# Should show your existing resource IDs and new monitoring resources
```

### **Step 2: Verify Kubernetes Cluster Still Works**
```bash
# Connect to controller via SSM
aws ssm start-session --target i-<your-controller-id>

# Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces
```

### **Step 3: Access New CloudWatch Features**
```bash
# Check the new CloudWatch dashboard
# URL will be in the CDK outputs
# Shows CPU/Memory metrics for both instances
```

## What You Accomplish

### **Learning Outcomes:**
1. **Hands-on AWS Console Experience** - Building resources manually
2. **Infrastructure-as-Code Skills** - CDK import and reference patterns  
3. **Migration Methodology** - Real-world skill for existing infrastructure
4. **Monitoring Setup** - CloudWatch alarms and dashboards
5. **Kubernetes Administration** - Manual cluster setup for CKA/CKAD

### **Infrastructure Benefits:**
1. **Existing Resources Preserved** - No disruption to running cluster
2. **Enhanced Monitoring** - CPU/Memory alarms and dashboard
3. **Infrastructure-as-Code** - Future changes managed through CDK
4. **Cost Optimization** - Only pay for what you actually use
5. **Documentation** - Infrastructure defined in code

## Directory Structure After Migration

```
typescript-cloud-projects/
├── docs/
│   ├── MANUAL_K8S_BUILD_GUIDE.md          # Manual build instructions
│   └── KUBERNETES_TROUBLESHOOTING_GUIDE.md # Complete troubleshooting knowledge
├── aws-cdk-examples/
│   ├── ec2/                                # Your original working infrastructure
│   └── ec2-migrate/                        # Migration project
│       ├── lib/
│       │   ├── ec2-migrate-stack.ts        # Creates new resources (alternative)
│       │   └── ec2-migration-stack.ts      # Imports existing resources (recommended)
│       └── README.md                       # Migration instructions
```

## Next Steps After Migration

1. **Practice Kubernetes Operations** - Reset, backup, restore procedures
2. **Test Monitoring** - Trigger CPU/memory alarms to verify alerts
3. **Enhance Infrastructure** - Add load balancers, auto-scaling, etc. through CDK
4. **Documentation** - Update manual procedures to reference CDK-managed resources
5. **Cost Monitoring** - Track costs of manual vs CDK-managed components

## Key Insight

This approach gives you:
- **Manual AWS expertise** (hands-on console experience)
- **Kubernetes fundamentals** (manual setup understanding)  
- **Infrastructure-as-Code skills** (CDK migration patterns)
- **Real-world migration experience** (import existing resources)
- **Production monitoring** (CloudWatch integration)

Perfect preparation for both **AWS certifications** and **Linux Foundation Kubernetes certifications**!