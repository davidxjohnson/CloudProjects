# CloudProjects Monorepo

[![CI/CD Pipeline](https://github.com/davidxjohnson/AwsCdkProjects/actions/workflows/ci.yml/badge.svg)](https://github.com/davidxjohnson/AwsCdkProjects/actions/workflows/ci.yml)
[![PR Validation](https://github.com/davidxjohnson/AwsCdkProjects/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/davidxjohnson/AwsCdkProjects/actions/workflows/pr-validation.yml)
[![codecov](https://codecov.io/gh/davidxjohnson/AwsCdkProjects/branch/main/graph/badge.svg)](https://codecov.io/gh/davidxjohnson/AwsCdkProjects)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A professional-grade TypeScript monorepo containing AWS CDK infrastructure projects and AWS SDK code examples with comprehensive CI/CD, testing, and quality assurance.

## 🚀 Quick Start

This monorepo uses pnpm workspaces for package management.

### Prerequisites
- Node.js 22.20.0+ (recommended) or Node.js 18.19.1+ (minimum)
- pnpm package manager
- AWS CLI configured (for CDK projects)
- kubectl configured (for Kubernetes examples)

### Important: Use pnpm, not npm
This is a **pnpm monorepo**. Always use `pnpm` commands instead of `npm`:
- `pnpm install` (not `npm install`)
- `pnpm build` (not `npm run build`)
- `pnpm --filter <package>` (for package-specific commands)

### Installation
```bash
pnpm install
```

### Working with CDK Projects
```bash
# Deploy the EKS cluster
cd aws-cdk-examples/eks
pnpm deploy
```

### Running SDK Examples
```bash
# Run a specific example
pnpm --filter @cloud-projects/list-lambdas-example build
pnpm --filter @cloud-projects/list-lambdas-example start

# Or navigate to the example directory
cd aws-sdk-examples/list-lambdas
pnpm build && pnpm start
```

## Project Goals

This monorepo demonstrates:
- **AWS Infrastructure as Code**: Real-world AWS infrastructure deployments using CDK
- **AWS SDK Best Practices**: Well-structured, type-safe AWS SDK usage examples
- **Professional Testing**: Comprehensive test suites with 97.61% code coverage
- **Modern CI/CD**: Automated testing, security scanning, and quality gates
- **Monorepo Management**: Efficient workspace organization with pnpm
- **TypeScript Development**: Strict typing with ES modules and modern standards

## 🏆 Quality Metrics

### Test Coverage
- **list-pods**: 97.61% coverage with 11 passing tests ✅
- **Comprehensive mocking**: All external dependencies properly mocked
- **Professional testing**: Vitest with modern testing practices

### CI/CD Pipeline
- ✅ **Automated testing** on every PR and push
- ✅ **Security scanning** with vulnerability detection
- ✅ **Code coverage** reporting with thresholds
- ✅ **Multi-package builds** with dependency caching
- ✅ **Branch protection** rules enforced

### Code Quality Standards
- TypeScript strict mode throughout
- ES modules for modern JavaScript
- Exact dependency versions (no caret ranges)
- Comprehensive error handling
- Professional CLI interfaces

## 🤝 Contributing

We welcome contributions! This project follows professional development practices:

### Before Contributing
1. Read our [Contributing Guide](.github/CONTRIBUTING.md)
2. Check existing issues and PRs
3. Follow the established patterns and standards

### Pull Request Requirements
- ✅ All tests must pass with high coverage
- ✅ Security scan must pass (no critical vulnerabilities)
- ✅ Code review approval required
- ✅ Branch protection rules enforced
- ✅ Conventional commit messages

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed guidelines.

### Terms of Use
The code in this repository can be used without restriction or warranty, designed to help developers learn by example.
