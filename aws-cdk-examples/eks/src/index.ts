import { App, Stack } from 'aws-cdk-lib';
import { Vpc, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Cluster, KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import { User } from 'aws-cdk-lib/aws-iam';
import { KubectlV33Layer } from '@aws-cdk/lambda-layer-kubectl-v33';

/**
 * EKS Cluster with Kubernetes 1.33
 * 
 * Authentication Configuration:
 * - Uses AL2023 AMI (compatible with K8s 1.33)
 * - Adds admin user to system:masters for kubectl access
 * - Supports both AWS CLI and aws-iam-authenticator authentication methods
 * 
 * Post-deployment kubectl setup:
 * 
 * Method 1 (Recommended for development):
 *   aws eks update-kubeconfig --region us-east-2 --name <cluster-name>
 * 
 * Method 2 (For federated/enterprise environments):
 *   eksctl utils write-kubeconfig --cluster <cluster-name> --region us-east-2
 *   (Requires aws-iam-authenticator v0.6.20+ for v1beta1 API compatibility)
 */

const app = new App();
const stack = new Stack(app, 'EksStack');

// Create a new VPC for the EKS cluster
const vpc = new Vpc(stack, 'Vpc', {
    maxAzs: 3, // Default is all AZs in the region
});

// Create the EKS cluster
const cluster = new Cluster(stack, 'EksCluster', {
    vpc,
    version: KubernetesVersion.V1_33,                    // Kubernetes 1.33 - requires AL2023 AMI
    kubectlLayer: new KubectlV33Layer(stack, 'kubectl'), // kubectl v1.33 layer for CDK operations
    defaultCapacity: 0,                                  // Don't create default capacity, we'll add node group manually
});

// Add the admin user to the cluster's aws-auth ConfigMap for kubectl access
// This enables both AWS CLI and aws-iam-authenticator authentication methods
cluster.awsAuth.addUserMapping(User.fromUserName(stack, 'AdminUser', 'admin'), {
    groups: ['system:masters'],  // Full cluster admin permissions
});

// Add a managed node group with AL2023 AMI type for Kubernetes 1.33 compatibility
// AL2023 is required for K8s 1.33+ (AL2_x86_64 only supports up to K8s 1.32)
cluster.addNodegroupCapacity('DefaultCapacity', {
    instanceTypes: [new InstanceType('m5.large')],
    minSize: 2,
    maxSize: 2,
    desiredSize: 2,
    amiType: NodegroupAmiType.AL2023_X86_64_STANDARD,   // AL2023 AMI supports Kubernetes 1.33
});

app.synth();

