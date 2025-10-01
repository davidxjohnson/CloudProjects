# AWS CDK Examples

## Setup

Before deploying CDK applications, initialize the CDK bootstrap stack in your AWS account:

```bash
npx cdk bootstrap
```

This creates the necessary S3 buckets and IAM roles that CDK uses to deploy your infrastructure.

## Projects

- **eks/** - Amazon EKS cluster deployment example