# Monorepo Setup Guide: pnpm, TypeScript, AWS CDK

This guide walks you through setting up a TypeScript monorepo for AWS CDK development using pnpm workspaces.

## Prerequisites
- AWS account & credentials (configured via AWS CLI or environment variables)

## 1. Install Node.js

Install Node.js (v18+ recommended). On Ubuntu/Debian:
Or use the official installer from https://nodejs.org/
```
sudo apt update
sudo apt install nodejs npm
```

## 2. Install pnpm Globally
```
npm install -g pnpm
```
## NOTE: 
if you cloned this project, skip to step 10.<br>
The steps 3 through 9 are instructional in case you are new to a Typesript mono repo for CDK and setting up manually.

## 3. Create Monorepo Structure
```
mkdir -p AwsCdkProjects/packages
cd AwsCdkProjects
```

## 4. Initialize the Monorepo
```
pnpm init
```

## 5. Setup pnpm Workspaces
Add to your root `package.json`:
```json
{
  "name": "aws-cdk-projects",
  "private": true,
  "workspaces": ["packages/*"],
  "packageManager": "pnpm@<your-version>"
}
```

## 6. Add TypeScript and CDK Dependencies
```
pnpm add -D typescript
pnpm add aws-cdk-lib constructs
```

## 7. Create Root TypeScript Config
Create a root `tsconfig.json` in `AwsCdkProjects/` for shared TypeScript settings:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## 8. Create a CDK App Package
```
mkdir -p packages/cdk-app/src
cd packages/cdk-app
pnpm init
```

### Example `package.json` for the app:
```json
{
  "name": "cdk-app",
  "version": "1.0.0",
  "main": "lib/index.js",
  "license": "MIT",
  "scripts": {
    "build": "tsc",
    "cdk": "cdk"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.208.0",
    "constructs": "^10.4.2"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Example `tsconfig.json` for the app:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "lib",
    "rootDir": "src",
    "module": "commonjs",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

### Example `cdk.json` for the app:
```json
{
  "app": "node lib/index.js"
}
```

### Example `src/index.ts` for the app:
```typescript
import { App, Stack, StackProps } from 'aws-cdk-lib';

class MyStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    // Define resources here
  }
}

const app = new App();
new MyStack(app, 'MyStack');
```

## 9. Create App README
Create a `README.md` in `packages/cdk-app/` to document your app:
```
echo "# cdk-app\n\nThis is an AWS CDK app written in TypeScript." > packages/cdk-app/README.md
```

## 10. Install All Dependencies
Run from the monorepo root:
```
pnpm install
```

## 11. Build and Deploy
From the app directory:
```
pnpm run build
pnpm run cdk synth
pnpm run cdk deploy
```

## 12. Useful pnpm Workspace Shortcuts
You can run commands for any package from the root:
```
pnpm --filter cdk-app run build
pnpm --filter cdk-app run cdk deploy
```

## 13. Global TypeScript (Optional)
If you want to use `tsc` everywhere:
```
sudo npm install -g typescript
```

# Monorepo Folder Structure

```
AwsCdkProjects/                # Monorepo root
├── node_modules/              # Root dependencies (managed by pnpm)
├── package.json               # Root package config and workspace settings
├── pnpm-lock.yaml             # pnpm lockfile for dependency versions
├── setup.md                   # Setup and instructions (this file)
├── tsconfig.json              # Root TypeScript config (shared)
└── packages/                  # All project packages live here
    └── cdk-app/               # Example AWS CDK app package
        ├── README.md          # App-specific documentation
        ├── cdk.json           # CDK CLI config (entry point)
        ├── cdk.out/           # CDK output (generated)
        ├── lib/               # Compiled JavaScript output
        │   ├── index.js       # Compiled entry point
        │   └── index.d.ts     # TypeScript declarations
        ├── node_modules/      # App-specific dependencies
        ├── package.json       # App package config
        ├── pnpm-lock.yaml     # App-specific lockfile (optional)
        ├── src/               # TypeScript source code
        │   └── index.ts       # Main CDK app code
        └── tsconfig.json      # App TypeScript config
```

---
This setup provides a scalable, modern workflow for TypeScript AWS CDK development in a monorepo using pnpm workspaces.
