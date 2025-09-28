# AWS SDK Examples

This directory contains a collection of TypeScript examples demonstrating AWS SDK v3.x usage patterns and cloud service integrations with Node.js. These examples are part of the CloudProjects monorepo, previously maintained in the [typescript-examples repository](https://github.com/davidxjohnson/typescript-examples).

## Terms of use
Programmers often learn by example, or just need a good starting point for a project. The code in this repository can be used without restriction or warranty.

## Criteria for inclusion
- Focus on AWS SDK v3 usage patterns and best practices.
- Real-world examples that demonstrate common cloud operations.
- Well-documented, standalone examples that can be run independently.
- Include proper error handling and TypeScript typing.
- Demonstrate testing capabilities, including code coverage and mocking where applicable.

## Available Examples

### AWS Lambda Examples
- **`list-lambdas`** - Demonstrates listing AWS Lambda functions using AWS SDK v3 with proper error handling and command-line interface

### Kubernetes Integration Examples  
- **`list-pods`** - Shows how to list Kubernetes pods using the Kubernetes JavaScript client with pagination support, includes comprehensive testing with **Vitest** and **97.61% code coverage**

## Running Examples

Each example is a separate npm package within this monorepo. To run an example:

1. Install dependencies from the monorepo root:
   ```bash
   pnpm install
   ```

2. Navigate to the specific example:
   ```bash
   cd aws-sdk-examples/list-lambdas
   # or
   cd aws-sdk-examples/list-pods
   ```

3. Build and run:
   ```bash
   pnpm build
   pnpm start
   ```

Or run directly from the monorepo root:
```bash
# List Lambda functions example
pnpm --filter @cloud-projects/list-lambdas-example build
pnpm --filter @cloud-projects/list-lambdas-example start

# List Kubernetes pods example  
pnpm --filter @cloud-projects/list-pods-example build
pnpm --filter @cloud-projects/list-pods-example start
```