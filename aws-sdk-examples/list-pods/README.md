# @cloud-projects/list-pods-example

### Description
A comprehensive TypeScript example demonstrating how to list Kubernetes pods using the [@kubernetes/client-node](https://github.com/kubernetes-client/javascript) library. This example includes pagination support, error handling, command-line interface, and extensive testing capabilities with mocking and code coverage metrics.

Part of the CloudProjects monorepo showcasing modern TypeScript development practices for cloud infrastructure automation. 

### What makes this example notable?

* **Modern TypeScript Configuration** - Uses ES2022 target with **ES modules** for Node.js 22.x compatibility, strict typing throughout

* **Professional Testing with Vitest** - Uses **Vitest 2.1.8** with comprehensive mocking capabilities, achieving **97.61% code coverage** with 11 passing tests

* **Production-Ready Error Handling** - Properly handles both API errors (namespace not found, permissions) and connection errors (network issues, cluster unreachable)

* **Pagination Support** - Implements proper pagination handling for large Kubernetes clusters using continuation tokens, following best practices for the `listNamespacedPod` API

* **Command-Line Interface** - Uses Commander.js for professional CLI with help, options validation, and sensible defaults

* **Monorepo Integration** - Part of CloudProjects monorepo with exact dependency versioning and workspace management via pnpm  

## Prerequisites

- Node.js 18.19.1+ (22.x LTS recommended)
- kubectl configured with access to a Kubernetes cluster
- Valid kubeconfig file (typically in `~/.kube/config`)

## Installation & Setup

From the monorepo root:
```bash
pnpm install
```

Or from this directory:
```bash
cd aws-sdk-examples/list-pods
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
node dist/list-pods.js --help

Options:
  -n, --namespace <string>   The k8s namespace to use (default: "kube-system")
  -p, --pagelimit <number>   The max number of items output per page (default: 10)
  -t, --timeout <number>     The max time to wait for a response (default: 10)
  -d, --dump                 Output all content of pod objects (default: false)
  -h, --help                 Display help for command
```

## Sample Runs

**Reminder:** Ensure your Kubernetes context is set before running:
```bash
kubectl config current-context
```

### Basic Usage
```bash
$ pnpm start

k8s cluster = my-cluster
namespace = kube-system
page limit = 10
timeout = 10
dump = false
coredns-76f75df574-8h2mx
coredns-76f75df574-qj4vx
aws-load-balancer-controller-7d4b8c8f9d-xyz12
aws-node-2mq29
aws-node-47ct8
aws-node-4cdkx
aws-node-5cd5x
aws-node-5hvr5
aws-node-5pvlf
aws-node-5vwzc
nextToken: eyJydiI6MTExMjEwNTgzMiwic3RhcnQiOiJhd3Mtbm9kZS01dndmZ1x1MDAwMCJ9
aws-node-8zxjq
aws-node-9b52k
...
bye
```

### Exploring Pod Details
```bash
$ pnpm start -- -p 1 -d -n default

k8s cluster = my-cluster
namespace = default
page limit = 1
timeout = 10
dump = true
[
  {
    "apiVersion": "v1",
    "kind": "Pod",
    "metadata": {
      "name": "my-app-7d4b8c8f9d-xyz12",
      "namespace": "default",
      "labels": {
        "app": "my-app",
        "version": "v1.2.3"
      }
    },
    "spec": {
      "containers": [
        {
          "name": "app",
          "image": "my-app:v1.2.3"
        }
      ]
    }
  }
]
nextToken: undefined
bye
```

## Testing

This example includes **professional-grade testing with Vitest**:

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Run with coverage
pnpm test:ui        # Interactive UI mode
```

### Excellent Coverage Results
- **11 passing tests** covering CLI and core logic
- **97.61% statement coverage** (exceeds 70% threshold ✅)
- **89.47% branch coverage** (exceeds 60% threshold ✅)
- **100% function coverage** (exceeds 70% threshold ✅)
- **97.61% line coverage** (exceeds 70% threshold ✅)

### Test Coverage
- ✅ **CLI Interface Testing** - Command line argument parsing, defaults, error handling
- ✅ **Core Pod Listing** - Basic functionality with API verification
- ✅ **Pagination Handling** - Continuation tokens and page limits
- ✅ **Dump Mode Testing** - JSON output formatting
- ✅ **Comprehensive Error Scenarios** - API errors, network failures, permissions
- ✅ **Constructor Patterns** - Default and custom client injection
- ✅ **Process Exit Handling** - Error recovery and proper cleanup

### Modern Testing Architecture
This project uses **Vitest 2.1.8** with professional-grade features:
- **Built-in vi.mock()** - Clean, intuitive mocking system
- **Native TypeScript support** - No configuration headaches
- **Built-in coverage** - v8 provider with HTML reports
- **Watch mode & UI** - Excellent developer experience
- **ES module support** - Modern JavaScript standards

See [COVERAGE.md](./COVERAGE.md) for detailed code coverage analysis and testing documentation.

## Architecture

### File Structure
```
aws-sdk-examples/list-pods/
├── src/
│   ├── list-pods.ts          # Main CLI application
│   ├── list-pods.test.ts     # CLI tests with Vitest
│   ├── pod-lister.ts         # Core pod listing logic
│   └── pod-lister.test.ts    # Core logic tests with Vitest
├── dist/                     # Compiled JavaScript output
├── coverage/                 # Vitest coverage reports
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration (with test files)
├── tsconfig.build.json       # Production build configuration
├── vitest.config.ts          # Vitest test configuration
├── README.md                 # This file
└── COVERAGE.md               # Testing and coverage documentation
```

### Key Design Patterns
- **Dependency Injection** - Pod lister accepts configurable API client
- **Interface Segregation** - Clear contracts between components
- **Error Handling** - Comprehensive error scenarios covered
- **Testability** - All external dependencies are mockable

## Development

### VSCode Integration
The Kubernetes client includes full TypeScript definitions. Try exploring pod properties:
```typescript
for (const pod of res.items as k8s.V1Pod[]) {
  console.log(pod.spec.); // VSCode will show available properties
}
```

### Common Issues
- **Context not set** - Use `kubectl config current-context` to verify
- **Permission denied** - Ensure your kubeconfig has proper RBAC permissions
- **Connection timeout** - Increase timeout with `-t <seconds>` option
- **Large clusters** - Use smaller page limits with `-p <number>` option

## Contributing

This example follows CloudProjects monorepo patterns:
- Exact dependency versions (no caret ranges)
- **ES modules** for modern JavaScript standards
- **Vitest testing framework** with professional coverage standards
- Comprehensive error handling and CLI interfaces
- TypeScript with strict typing throughout
