# TypeScript Cloud Development Portfolio

[![CI/CD Pipeline](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/ci.yml)
[![PR Validation](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/davidxjohnson/CloudProjects/actions/workflows/pr-validation.yml)
[![codecov](https://codecov.io/gh/davidxjohnson/CloudProjects/branch/main/graph/badge.svg)](https://codecov.io/gh/davidxjohnson/CloudProjects)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Professional TypeScript cloud development showcasing modern DevOps practices, infrastructure as code, and production-ready automation tools.**

> 🎯 **Target Audience:** DevOps Engineers, Cloud Architects, and Senior Developers working with TypeScript in cloud environments.

## 🔥 **What You'll Find Here**

### **Infrastructure as Code**
- **AWS CDK Projects** - Production-ready infrastructure deployments
- **Kubernetes Integration** - EKS clusters with proper RBAC and networking
- **Multi-environment Support** - Scalable patterns for dev/staging/prod

### **Cloud Automation & APIs** 
- **AWS SDK Best Practices** - Type-safe, testable cloud integrations
- **CLI Tools** - Professional command-line interfaces with comprehensive help
- **Separation of Concerns** - Clean architecture patterns for maintainable code

### **DevOps Excellence**
- **97.61% Test Coverage** - Comprehensive testing with mocks and integration tests
- **Professional CI/CD** - Automated pipelines with security scanning and quality gates
- **Branch Protection Workflow** - Enterprise-grade development practices

## � **Project Structure**

```
typescript-cloud-projects/
├── 🏗️  aws-cdk-examples/          # Infrastructure as Code
│   └── eks/                      # Production EKS cluster deployment
├── ☁️  aws-sdk-examples/          # Cloud Service Integration  
│   ├── list-pods/               # Kubernetes API with 97.61% test coverage
│   └── list-lambdas/            # AWS Lambda management tools
├── 📚  docs/                     # Technical Documentation
│   ├── REFACTORING_FOR_TESTABILITY_OVERVIEW.md  # Code quality case study
│   ├── EKS_AUTHENTICATION_GUIDE.md              # Production K8s setup
│   └── DEPENDENCY_MANAGEMENT_TUTORIAL.md        # Monorepo best practices
├── 🔧  scripts/                  # DevOps Automation
│   ├── pr-workflow.sh           # Professional development workflow
│   ├── validate-local.sh        # Pre-commit quality checks
│   └── manage-dependabot-automerge.sh  # Dependency automation
└── 🛡️  .github/                  # CI/CD & Quality Assurance
    ├── workflows/               # GitHub Actions pipelines
    ├── CODEOWNERS              # Team responsibility matrix
    └── pull_request_template.md # Standardized PR process
```

## 🎯 **Featured Projects**

### **🏗️ Production EKS Cluster** (`aws-cdk-examples/eks/`)
**What it demonstrates:** Complex infrastructure deployment with AWS CDK
- Multi-AZ EKS cluster with managed node groups
- IAM roles and policies for secure access
- VPC networking with proper security groups
- One-command deployment: `pnpm deploy`

### **☁️ Kubernetes Pod Management** (`aws-sdk-examples/list-pods/`)
**What it demonstrates:** Professional TypeScript architecture and testing
- Clean separation of concerns (CLI ↔ Business Logic ↔ Infrastructure)
- 97.61% test coverage with comprehensive mocking
- Dependency injection for testability
- Production-ready error handling and pagination

### **📚 Refactoring Case Study** (`docs/REFACTORING_FOR_TESTABILITY_OVERVIEW.md`)
**What it demonstrates:** Senior-level code architecture and mentoring capability
- Before/after code comparison with detailed annotations
- Explanation of separation of concerns principles
- Testing strategy transformation
- Technical leadership and knowledge transfer skills

## 💼 **Professional Impact**

This repository demonstrates **5+ years of AWS experience** applied to modern TypeScript development:

### **DevOps Leadership**
- **Branch Protection & PR Workflows** - Enterprise development practices
- **Automated Quality Gates** - CI/CD with testing, security scanning, coverage thresholds  
- **Dependency Management** - Automated updates with safety checks via Dependabot

### **Cloud Architecture**
- **Infrastructure as Code** - CDK for repeatable, version-controlled deployments
- **Container Orchestration** - EKS with proper IAM, networking, and security
- **API Integration** - AWS SDK usage following cloud-native patterns

### **Code Quality & Mentoring**
- **Testing Excellence** - 97.61% coverage demonstrates commitment to reliability
- **Architecture Documentation** - Detailed case studies for knowledge transfer
- **Clean Code Patterns** - Separation of concerns, dependency injection, error handling

> 💡 **For Hiring Managers:** This work represents the kind of maintainable, tested, documented code that scales from prototypes to production systems.

## 🚀 Development Workflow

This project uses **branch protection** and **pull request workflow** to maintain code quality.

### 🔄 Quick Start (New Workflow)

```bash
# 1. Start new feature
./scripts/pr-workflow.sh start feature/my-awesome-feature

# 2. Make your changes...

# 3. Validate locally (always do this!)
./scripts/pr-workflow.sh validate

# 4. Commit changes
git add .
git commit -m "feat: add awesome feature"

# 5. Push and create PR
./scripts/pr-workflow.sh push
# This gives you a GitHub PR link - click it to create the PR

# 6. Wait for CI/CD to pass, then merge!
```

### Prerequisites
- Node.js 18.19.1 (pinned for stability)
- pnpm 10.14.0 (managed via package.json)
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

## 📚 Documentation & Workflow

- 📖 [Branch Protection Setup](docs/BRANCH_PROTECTION.md) - How to set up GitHub branch protection
- 🔄 [Contributing Guide](.github/CONTRIBUTING.md) - Contribution guidelines and workflow
- 🚀 [PR Workflow Scripts](scripts/) - Automated workflow helpers
- 📋 [Change Log](change-log.md) - Version history and updates

### Workflow Commands

```bash
# Check current status
./scripts/pr-workflow.sh status

# Start a new feature
./scripts/pr-workflow.sh start feature/my-feature

# Validate before pushing (crucial!)
./scripts/pr-workflow.sh validate

# Push and get PR link
./scripts/pr-workflow.sh push

# Clean up merged branches
./scripts/pr-workflow.sh cleanup

# Get help
./scripts/pr-workflow.sh help
```

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
- ✅ **Pull request workflow** with quality gates

### Code Quality Standards
- TypeScript strict mode throughout
- ES modules for modern JavaScript
- Exact dependency versions (no caret ranges)
- Comprehensive error handling
- Professional CLI interfaces
- Conventional commit messages

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

## 🗺️ **Portfolio Roadmap**

This TypeScript repository is part of a larger **multi-language cloud development portfolio**:

### **Coming Soon**
- **Go DevOps Tools** - High-performance CLI utilities and Kubernetes operators
- **Java Enterprise Services** - Spring Boot microservices and enterprise integrations  
- **Python Automation** - AWS automation scripts and infrastructure tooling

### **Portfolio Hub**
- **GitHub Pages Site** - Professional landing page organizing all language-specific repositories
- **Case Studies** - Real-world transformation stories from DevOps leadership experience
- **Certifications & Resume** - Comprehensive professional credentials showcase

> 🎯 **Vision:** Demonstrate full-stack cloud engineering capabilities across multiple languages and use cases, positioned for **Cloud Engineer**, **Senior DevOps Engineer**, and **DevOps Manager** roles at enterprise organizations.
