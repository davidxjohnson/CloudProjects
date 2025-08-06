import { App, Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { KubectlV32Layer } from '@aws-cdk/lambda-layer-kubectl-v32';

const app = new App();
const stack = new Stack(app, 'EksStack');

// Create a new VPC for the EKS cluster
const vpc = new Vpc(stack, 'Vpc', {
    maxAzs: 3, // Default is all AZs in the region
});

// Create the EKS cluster
new Cluster(stack, 'EksCluster', {
    vpc,
    version: KubernetesVersion.V1_32,                    // Use a stable supported version
    kubectlLayer: new KubectlV32Layer(stack, 'kubectl'), // transitionary kubectl layer from CDK V1
    defaultCapacity: 2,                                  // Number of worker nodes
});

app.synth();

