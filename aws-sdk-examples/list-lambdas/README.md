# @cloud-projects/list-lambdas-example

### Description
A comprehensive TypeScript example demonstrating how to list AWS Lambda functions using the [@aws-sdk/client-lambda](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/index.html) module. This example includes pagination support, error handling, command-line interface, and extensive testing capabilities.

Part of the CloudProjects monorepo showcasing modern AWS SDK v3 usage patterns with Node.js.

### What makes this example notable?

* **AWS SDK v3 Benefits** - Improved async/await functionality avoiding [callback](https://callbackhell.com/) hell and effortless pagination using async iterators

* **Modern TypeScript Configuration** - ES2022 with ES modules, strict typing throughout with comprehensive type imports and interfaces

* **Professional Testing with Vitest** - Comprehensive testing achieving **95.38% coverage** with **17 passing tests**

* **Production-Ready Features** - Advanced AWS SDK mocking, CLI interface with Commander.js, and comprehensive error handling

## Prerequisites

- Node.js 18.19.1+ (22.x LTS recommended)
- AWS CLI configured with valid credentials
- Valid AWS context with Lambda permissions

## Installation & Setup

From the monorepo root:
```bash
pnpm install
```

Or from this directory:
```bash
cd aws-sdk-examples/list-lambdas
pnpm install
```

## Usage

### Build and Run
```bash
pnpm build
pnpm start
```

### Command-Line Options
```bash
node dist/list-lambdas.js --help

Options:
  -r, --region <string>     The AWS region name to use (default: "us-east-2")
  -p, --pagesize <number>   Number of items per page (default: 50)
  -h, --help               Display help for command
```

## Sample Runs

**Reminder:** Set your AWS context prior to running this example.

### Basic Usage
```bash
$ pnpm start

processing.....
[
  'financials',
  'authentication',
  'repair',
  'operations',
  'workqueue',
  ... 151 more items
]
success!
```

### Custom Region and Page Size
```bash
$ pnpm start -- --region us-west-2 --pagesize 25

processing.....
[
  'data-processor',
  'image-resizer',
  'notification-handler',
  ... 25 more items per page
]
success!
```

## Testing

This example includes **professional-grade testing with Vitest and comprehensive mocking**:

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Run with coverage
pnpm test:ui        # Interactive UI mode
```

### Modern Testing Architecture
This project uses **Vitest 2.1.9** with professional-grade features:
- **Built-in vi.mock()** - Clean, intuitive mocking system
- **Native TypeScript support** - No configuration headaches
- **Built-in coverage** - v8 provider with HTML reports
- **Watch mode & UI** - Excellent developer experience
- **ES module support** - Modern JavaScript standards

### Test Coverage
- ✅ **CLI Interface Testing** - Command line argument parsing, defaults, error handling
- ✅ **Core Lambda Listing** - Basic functionality with AWS SDK verification
- ✅ **Pagination Handling** - Async iterator pagination and page limits
- ✅ **Comprehensive Error Scenarios** - AWS API errors, network failures, permissions
- ✅ **Constructor Patterns** - Default and custom client injection
- ✅ **Process Exit Handling** - Error recovery and proper cleanup

### Excellent Coverage Results
- **17 passing tests** covering CLI and core logic
- **95.38% statement coverage** (exceeds 70% threshold ✅)
- **88.23% branch coverage** (exceeds 60% threshold ✅)
- **100% function coverage** (exceeds 70% threshold ✅)
- **95.38% line coverage** (exceeds 70% threshold ✅)

## Repo Organization

### File Structure
```
aws-sdk-examples/list-lambdas/
├── src/
│   ├── list-lambdas.ts        # Main CLI application
│   ├── list-lambdas.test.ts   # CLI tests with Vitest
│   ├── lambda-lister.ts       # Core lambda listing logic
│   └── lambda-lister.test.ts  # Core logic tests with Vitest
├── dist/                      # Compiled JavaScript output
├── coverage/                  # Vitest coverage reports
├── package.json               # Project configuration
├── tsconfig.json              # TypeScript configuration (with test files)
├── tsconfig.build.json        # Production build configuration
├── vitest.config.ts           # Vitest test configuration
└── README.md                  # This file
```

### Key Design Patterns
- **Dependency Injection** - Lambda lister accepts configurable AWS client
- **Interface Segregation** - Clear contracts between components
- **Error Handling** - Comprehensive error scenarios covered
- **Testability** - All external dependencies are mockable

## Development

### VSCode Integration
The AWS SDK includes full TypeScript definitions. Try exploring Lambda properties:
```typescript
for await (const page of paginator) {
  for (const func of page.Functions!) {
    console.log(func.); // VSCode will show available properties
  }
}
```

### Common Issues
- **AWS credentials not set** - Use `aws configure` or set environment variables
- **Permission denied** - Ensure your AWS credentials have Lambda:ListFunctions permission
- **Region not found** - Use valid AWS region identifiers
- **Rate limiting** - Reduce page size with `-p <number>` option