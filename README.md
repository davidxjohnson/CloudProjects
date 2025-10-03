# TypeScript Cloud Projects

[![CI/CD Pipeline](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml)
[![PR Validation](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml)
[![codecov](https://codecov.io/gh/davidxjohnson/CloudProjects/branch/main/graph/badge.svg)](https://codecov.io/gh/davidxjohnson/CloudProjects)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript cloud development projects demonstrating AWS infrastructure, DevOps automation, and testing practices.

> **Documentation:** [Technical Overview](docs/TECHNICAL_OVERVIEW.md) | [Developer Guide](docs/DEVELOPER_GUIDE.md)

## **Project Goals**

This monorepo demonstrates:
- **TypeScript Development**: Strict typing with ES modules and modern standards
- **Monorepo Management**: Efficient workspace organization with pnpm
- **AWS Infrastructure as Code**: Real-world AWS infrastructure deployments using CDK
- **AWS SDK Best Practices**: Well-structured, type-safe AWS SDK usage examples
- **Professional Testing**: Comprehensive test suites with 90%+ code coverage (with mocks)
- **Modern CI/CD**: Automated testing, security scanning, and quality gates

## **What You'll Find Here**

### ☸️ **Production EKS Cluster** [`aws-cdk-examples/eks/`]
Complex infrastructure deployment with AWS CDK - Multi-AZ cluster, IAM policies, VPC networking, one-command deployment

### ☸️ **Kubernetes Pod Management** [`aws-sdk-examples/list-pods/`]  
Professional TypeScript architecture (using K8S SDK) with 97.61% test coverage - Clean separation of concerns, dependency injection, comprehensive mocking

### ⚡ **Lambda Function Management** [`aws-sdk-examples/list-lambdas/`]
AWS Lambda management with TypeScript - List and manage Lambda functions using AWS SDK best practices with comprehensive error handling, high code coverage with use of Mock.

### 🔄 **Refactoring Case Study** [`docs/REFACTORING_FOR_TESTABILITY_OVERVIEW.md`]
Senior-level mentoring documentation - Before/after comparisons, testing strategy transformation, technical leadership

###  🚀 **DevOps Automation** [`scripts/`]
Professional CI/CD pipelines and workflow scripts - Branch protection, PR workflows, automated validation, dependency management

---

**Documentation:** See [Technical Overview](docs/TECHNICAL_OVERVIEW.md) for detailed project analysis or [Developer Guide](docs/DEVELOPER_GUIDE.md) for setup and development workflow.

## **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
