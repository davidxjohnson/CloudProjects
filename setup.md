# Cloud Projects Monorepo Setup Guide

This guide walks you through setting up a TypeScript monorepo for cloud development using pnpm workspaces. This includes AWS CDK infrastructure projects and AWS SDK examples.

## Prerequisites
- AWS account & credentials (configured via AWS CLI or environment variables)
- Node.js 22.x LTS (recommended for latest features and security)

## 1. Install Node.js

Install Node.js 22.x LTS (recommended). On Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Or use the official installer from https://nodejs.org/

Verify installation:
```bash
node --version  # Should show v22.x.x
npm --version
```

## 2. Install pnpm Globally
```bash
npm install -g pnpm@latest
```

## 3. Prevent npm Usage (Optional but Recommended)
Create a script to enforce pnpm usage and prevent accidental npm installs:
```bash
# Create prevent-npm.sh
cat > prevent-npm.sh << 'EOF'
#!/bin/bash
if [ -f "package.json" ] && [ ! -f "node_modules/.pnpm" ]; then
    echo "❌ Use 'pnpm install' instead of 'npm install' in this project"
    exit 1
fi
EOF
chmod +x prevent-npm.sh
```
## NOTE: 
If you cloned this project, skip to step 8.<br>
The steps 4 through 7 are instructional in case you are new to a TypeScript monorepo for cloud development and setting up manually.

## 4. Create Monorepo Structure
```bash
mkdir -p CloudProjects/{aws-cdk-examples,aws-sdk-examples}
cd CloudProjects
```

## 5. Initialize the Monorepo
```bash
pnpm init
```

## 6. Setup pnpm Workspaces
Add to your root `package.json`:
```json
{
  "name": "cloud-projects",
  "private": true,
  "workspaces": [
    "aws-cdk-examples/*",
    "aws-sdk-examples/*"
  ],
  "packageManager": "pnpm@10.14.0"
}
```

## 7. Add Shared Dependencies with Exact Versions
Use exact versions (no carets) to reduce dependabot noise:
```bash
# Core dependencies
pnpm add -D typescript@5.9.2 @types/node@22.10.12
pnpm add aws-cdk-lib@2.213.0 constructs@10.4.2
pnpm add @aws-sdk/client-lambda@3.717.0 @aws-sdk/client-eks@3.717.0
pnpm add @kubernetes/client-node@1.0.1 commander@12.1.0
```

## 8. Create Root TypeScript Config
Create a root `tsconfig.json` in `CloudProjects/` for shared TypeScript settings:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "outDir": "./lib",
    "rootDir": "./src"
  }
}
```

## 9. Create Example Projects

### CDK Infrastructure Example
```bash
mkdir -p aws-cdk-examples/eks/src
cd aws-cdk-examples/eks
pnpm init
```

#### Example CDK `package.json`:
```json
{
  "name": "@cloud-projects/eks",
  "version": "1.0.0",
  "main": "lib/index.js",
  "license": "MIT",
  "scripts": {
    "build": "tsc",
    "cdk": "cdk"
  }
}
```

### AWS SDK Example
```bash
cd ../../aws-sdk-examples
mkdir -p list-lambdas/src
cd list-lambdas
pnpm init
```

#### Example SDK `package.json`:
```json
{
  "name": "@cloud-projects/list-lambdas-example",
  "version": "1.0.0",
  "main": "lib/list-lambdas.js",
  "license": "MIT",
  "scripts": {
    "build": "tsc",
    "start": "node lib/list-lambdas.js"
  }
}
```

### Example `tsconfig.json` for projects:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "lib",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

### Example CDK `cdk.json`:
```json
{
  "app": "node lib/index.js",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true"
  }
}
```

### Example CDK `src/index.ts`:
```typescript
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class EksStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, 'EksVpc', {
      maxAzs: 2
    });
    
    const cluster = new eks.Cluster(this, 'EksCluster', {
      vpc,
      version: eks.KubernetesVersion.V1_27
    });
  }
}

const app = new App();
new EksStack(app, 'EksStack');
```

### Example SDK `src/list-lambdas.ts`:
```typescript
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';

async function listLambdaFunctions() {
  const client = new LambdaClient({ region: 'us-east-1' });
  const command = new ListFunctionsCommand({});
  
  try {
    const response = await client.send(command);
    console.log('Lambda Functions:');
    response.Functions?.forEach(func => {
      console.log(`- ${func.FunctionName}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listLambdaFunctions();
```

## 10. Setup Git Configuration (Recommended)
Create comprehensive git configuration:

### `.gitignore`:
```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
lib/
dist/
*.tsbuildinfo

# CDK outputs
cdk.out/
.cdk.staging/

# AWS
.aws/
*.pem

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### `.gitattributes`:
```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# TypeScript files
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf

# Shell scripts
*.sh text eol=lf

# Documentation
*.md text eol=lf
```

## 11. Install All Dependencies
Run from the monorepo root:
```bash
pnpm install
```

## 12. Build and Test
Build all projects:
```bash
pnpm build
```

For CDK projects:
```bash
cd aws-cdk-examples/eks
pnpm run cdk synth
pnpm run cdk deploy
```

For SDK examples:
```bash
cd aws-sdk-examples/list-lambdas  
pnpm start
```

## 13. Useful pnpm Workspace Commands
Run commands for specific packages:
```bash
# Build specific project
pnpm --filter @cloud-projects/eks run build

# Deploy CDK project
pnpm --filter @cloud-projects/eks run cdk deploy

# Run SDK example
pnpm --filter @cloud-projects/list-lambdas-example start

# Build all projects
pnpm -r build

# List all workspace projects
pnpm list -r --depth 0
```

## 14. Dependency Management Best Practices

### Exact Versions Strategy
- Use exact versions (no `^` or `~`) in package.json to reduce dependabot noise
- Consolidate shared dependencies in the root package.json
- This approach reduced dependabot PRs by ~75%

### Version Alignment
```bash
# Check for version mismatches
pnpm list -r --depth 0

# Update all packages to latest versions
pnpm update -r --latest
```

## 15. Optional: Global TypeScript
If you want to use `tsc` globally:
```bash
npm install -g typescript@latest
```

# Cloud Projects Monorepo Structure

```
CloudProjects/                 # Monorepo root
├── .gitignore                 # Git ignore rules
├── .gitattributes             # Git line ending configuration
├── README.md                  # Project documentation
├── setup.md                   # This setup guide
├── change-log.md              # Project change history
├── prevent-npm.sh             # Script to enforce pnpm usage
├── lint.sh                    # Linting script
├── package.json               # Root package config and workspace settings
├── pnpm-lock.yaml             # pnpm lockfile for dependency versions
├── pnpm-workspace.yaml        # Workspace configuration
├── tsconfig.json              # Root TypeScript config (shared)
├── node_modules/              # Root dependencies (managed by pnpm)
├── aws-cdk-examples/          # AWS CDK infrastructure projects
│   └── eks/                   # EKS cluster example
│       ├── README.md          # Project-specific documentation
│       ├── cdk.json          # CDK CLI config
│       ├── package.json      # Project dependencies
│       ├── tsconfig.json     # Project TypeScript config
│       ├── cdk.out/          # CDK output (generated)
│       ├── lib/              # Compiled JavaScript output
│       └── src/              # TypeScript source code
│           └── index.ts      # Main CDK app code
└── aws-sdk-examples/          # AWS SDK usage examples
    ├── list-lambdas/          # Lambda listing example
    │   ├── README.md          # Example documentation
    │   ├── package.json       # Example dependencies
    │   ├── tsconfig.json      # TypeScript configuration
    │   ├── lib/               # Compiled output
    │   └── src/               # Source code
    │       └── list-lambdas.ts
    └── list-pods/             # Kubernetes pods example
        ├── README.md
        ├── package.json
        ├── tsconfig.json
        ├── lib/
        └── src/
            └── list-pods.ts
```

---
This setup provides a scalable, modern workflow for cloud development in a TypeScript monorepo using pnpm workspaces. The exact version strategy and dual workspace structure (CDK + SDK examples) ensures consistent builds and reduces maintenance overhead.
