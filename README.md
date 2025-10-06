# TypeScript Cloud Projects

[![CI/CD Pipeline](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml)
[![PR Validation](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml)
[![codecov](https://codecov.io/gh/davidxjohnson/CloudProjects/branch/main/graph/badge.svg)](https://codecov.io/gh/davidxjohnson/CloudProjects)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern TypeScript cloud development demonstrating AWS infrastructure, DevOps automation, and production-ready testing practices.

## **aws-cdk-examples/**

Infrastructure as Code projects using AWS CDK with TypeScript.

- **[`eks/`](aws-cdk-examples/eks)** - Complete EKS cluster deployment with Kubernetes 1.33, AL2023 AMI support, and proper IAM configuration. Demonstrates production-ready container orchestration setup.

- **[`lambda/`](aws-cdk-examples/lambda)** - Serverless function deployment with API Gateway integration. Includes three Lambda functions showcasing different patterns: HTTP endpoints, data processing, and monitoring.

## **aws-sdk-examples/**

Cloud service integration using AWS SDK v3 with comprehensive testing.

- **[`list-lambdas/`](aws-sdk-examples/list-lambdas)** - Command-line tool for managing Lambda functions with 95.65% test coverage. Features pagination, error handling, and professional CLI interface using Commander.js.

- **[`list-pods/`](aws-sdk-examples/list-pods)** - Kubernetes API integration for pod management with 97.61% test coverage. Demonstrates cloud-native application patterns and robust testing strategies.

## **scripts/**

DevOps automation and workflow management tools.

- **[`create-feature-branch.sh`](scripts/create-feature-branch.sh)** - Automated feature branch creation with validation
- **[`pr-workflow.sh`](scripts/pr-workflow.sh)** - Pull request workflow automation with CI/CD integration  
- **[`validate-local.sh`](scripts/validate-local.sh)** - Pre-commit validation and quality checks
- **[`manage-dependabot-automerge.sh`](scripts/manage-dependabot-automerge.sh)** - Automated dependency management
- **[`dependabot-helper`](scripts/dependabot-helper)** - Dependabot configuration utilities

## **.github/**

CI/CD pipeline configuration and repository automation.

- **[`workflows/`](.github/workflows)** - GitHub Actions for automated testing, security scanning, and deployment
- **[`dependabot.yml`](.github/dependabot.yml)** - Automated dependency updates with security monitoring
- **[`CODEOWNERS`](.github/CODEOWNERS)** - Code review automation and ownership management
- **[Pull request templates](.github/PULL_REQUEST_TEMPLATE)** - Standardized PR process with quality gates

## **docs/**

Technical documentation and development guides.

- **[`TECHNICAL_OVERVIEW.md`](docs/TECHNICAL_OVERVIEW.md)** - Architecture decisions and system design patterns
- **[`DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)** - Setup instructions and development workflows  
- **[`EKS_AUTHENTICATION_GUIDE.md`](docs/EKS_AUTHENTICATION_GUIDE.md)** - Production Kubernetes cluster configuration
- **[`DEPENDENCY_MANAGEMENT_TUTORIAL.md`](docs/DEPENDENCY_MANAGEMENT_TUTORIAL.md)** - Monorepo dependency strategies
- **[`Additional guides`](docs/)** - Dependabot management, Node.js compatibility, GitHub CLI usage, and validation checklists

---

**Key Features:** Production-ready code patterns • Comprehensive testing (95%+ coverage) • Modern DevOps practices • Enterprise-grade automation
