# Monorepo Setup Guide: pnpm, TypeScript, AWS CDK

This guide walks you through setting up a TypeScript monorepo for AWS CDK development using pnpm workspaces.

## Prerequisites
- Node.js (v18+ recommended)
- npm (comes with Node.js)
- AWS account & credentials (configured via AWS CLI or environment variables)

## 1. Install pnpm Globally
```
npm install -g pnpm
```

## 2. Create Monorepo Structure
```
mkdir -p AwsCdkProjects/packages
cd AwsCdkProjects
```

## 3. Initialize the Monorepo
```
pnpm init
```

## 4. Setup pnpm Workspaces
Add to your root `package.json`:
```json
{
  "name": "aws-cdk-projects",
  "private": true,
  "workspaces": ["packages/*"],
  "packageManager": "pnpm@<your-version>"
}
```

## 5. Add TypeScript and CDK Dependencies
```
pnpm add -D typescript
pnpm add aws-cdk-lib constructs
```

## 6. Create a CDK App Package
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

## 7. Install All Dependencies
Run from the monorepo root:
```
pnpm install
```

## 8. Build and Deploy
From the app directory:
```
pnpm run build
pnpm run cdk synth
pnpm run cdk deploy
```

## 9. Useful pnpm Workspace Shortcuts
You can run commands for any package from the root:
```
pnpm --filter cdk-app run build
pnpm --filter cdk-app run cdk deploy
```

## 10. Global TypeScript (Optional)
If you want to use `tsc` everywhere:
```
sudo npm install -g typescript
```

---
This setup provides a scalable, modern workflow for TypeScript AWS CDK development in a monorepo using pnpm workspaces.
