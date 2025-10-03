# Developer Guide

> 🛠️ **Complete Developer Resource:** Everything you nee## 🔄 **Development Workflow & Commands** to contribute to this project, organized in the order you'll actually use it.

## 🚀 **Environment Setup**

### Prerequisites
- **Node.js 18.19.1** (pinned for stability)
- **pnpm 10.14.0** (managed via package.json)
- **AWS CLI configured** (for CDK projects)
- **kubectl configured** (for Kubernetes examples)

### Important: Use pnpm, not npm
This is a **pnpm monorepo**. Always use `pnpm` commands instead of `npm`:
- `pnpm install` (not `npm install`)
- `pnpm build` (not `npm run build`)
- `pnpm --filter <package>` (for package-specific commands)

### Installation

```bash
# Clone the repository
git clone https://github.com/davidxjohnson/typescript-cloud-projects.git
cd typescript-cloud-projects

# Install all dependencies
pnpm install
```

### Quick Start Examples

#### AWS SDK Examples
```bash
# Run the Kubernetes pod listing example
cd aws-sdk-examples/list-pods
pnpm build && pnpm start

# Or using workspace filter
pnpm --filter @cloud-projects/list-pods-example build
pnpm --filter @cloud-projects/list-pods-example start
```

#### AWS CDK Infrastructure
```bash
# Deploy the EKS cluster (requires AWS credentials)
cd aws-cdk-examples/eks
pnpm install
pnpm deploy

# View the infrastructure code
pnpm synth  # Generates CloudFormation templates
```

## 📁 **Project Structure**

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

## � **Development Workflow & Commands**

### Essential Commands

#### Testing
```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @cloud-projects/list-pods-example test

# Run tests with coverage
pnpm --filter @cloud-projects/list-pods-example test:coverage
```

#### Building
```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter @cloud-projects/list-pods-example build
```

#### Local Validation
Always run local validation before pushing:
```bash
./scripts/validate-local.sh
```

This script runs:
- TypeScript compilation
- Linting (ESLint)
- Testing with coverage
- Security scanning
- Build verification

### SDLC Workflow

#### Step 1: Start New Feature
```bash
# Start new feature branch
./scripts/pr-workflow.sh start feature/my-awesome-feature

# Make your changes...
```

#### Step 2: Development Cycle
```bash
# Build and test as you develop
pnpm build
pnpm test

# Validate locally before committing
./scripts/pr-workflow.sh validate
```

#### Step 3: Commit Changes
```bash
# Stage and commit with conventional format
git add .
git commit -m "feat: add awesome feature"
```

#### Step 4: Submit for Review
```bash
# Push and create PR
./scripts/pr-workflow.sh push
# This gives you a GitHub PR link - click it to create the PR
```

#### Step 5: Deployment
After PR approval and merge, the CI/CD pipeline automatically:
- Runs all tests and security scans
- Builds all packages
- Deploys infrastructure changes (if applicable)

### Workflow Commands Reference
```bash
# Check current status
./scripts/pr-workflow.sh status

# Start a new feature
./scripts/pr-workflow.sh start feature/my-feature

# Validate before pushing
./scripts/pr-workflow.sh validate

# Push and get PR link
./scripts/pr-workflow.sh push

# Clean up merged branches
./scripts/pr-workflow.sh cleanup

# Get help
./scripts/pr-workflow.sh help
```

## 🛡️ **Development Standards**

### Branch Protection
The `main` branch has these protections:
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Include administrators** (applies rules to repo admins too)
- ❌ **Allow force pushes** (prevents force push to main)
- ❌ **Allow deletions** (prevents accidental deletion)

### Required CI/CD Checks
These checks must pass before merge to main:
- `Lint & Format Check`
- `Build All Packages`
- `Test & Coverage`
- `Security Audit`
- `Quality Gate`

### Commit Standards
We use [Conventional Commits](https://conventionalcommits.org/):

```bash
feat: add new feature
fix: resolve bug in component
docs: update README
style: format code
refactor: restructure module
test: add test coverage
chore: update dependencies
```

### Branch Naming
Use descriptive branch names:
```bash
feature/add-s3-integration
fix/memory-leak-in-parser
docs/api-documentation-update
refactor/extract-common-utilities
```

## 🏆 **Quality Standards**

### Code Quality Requirements
- TypeScript strict mode throughout
- ES modules for modern JavaScript
- Exact dependency versions (no caret ranges)
- Comprehensive error handling
- Professional CLI interfaces
- Conventional commit messages

### Testing Requirements
- **Minimum 95% test coverage** for new code
- **Comprehensive mocking** of external dependencies
- **Integration tests** for critical paths
- **Type safety** throughout test suites

### Architecture Guidelines
- **Clean Architecture** - Separate concerns between CLI, business logic, and infrastructure
- **Dependency Injection** - Enable testability and modularity
- **Error Handling** - Comprehensive error boundaries and user-friendly messages
- **Type Safety** - Strict TypeScript throughout, no `any` types

## 🔍 **Code Review Process**

### What We Look For
- **Functionality** - Does the code work as intended?
- **Testing** - Is there adequate test coverage?
- **Architecture** - Does it follow our patterns?
- **Performance** - Are there any obvious performance issues?
- **Security** - Any security vulnerabilities?
- **Documentation** - Is the code well-documented?

### Review Process
1. **Automated Checks** - CI/CD pipeline must pass
2. **Code Review** - At least one approval required
3. **Manual Testing** - Reviewer tests functionality
4. **Merge** - Squash and merge with clean commit message

## 🚨 **Security Standards**

### Dependency Management
- **Dependabot** - Automated dependency updates
- **Security Scanning** - Regular vulnerability scans
- **Version Pinning** - Exact versions (no caret ranges)
- **Audit** - Regular `npm audit` / `pnpm audit`

### Secrets Management
- **No secrets in code** - Use environment variables
- **AWS credentials** - Use IAM roles when possible
- **API keys** - Store in secure environment variables
- **Kubernetes secrets** - Use proper secret management

### 🤖 Dependabot Auto-merge

This repository includes intelligent Dependabot management:
- **Disables auto-merge** on Dependabot PRs when feature PRs are active (prevents conflicts)
- **Re-enables auto-merge** when only Dependabot PRs remain
- **Maintains all quality gates** for dependency updates

For detailed information and manual control options, see: [Dependabot Management Guide](DEPENDABOT_MANAGEMENT.md)

## 🔧 **Troubleshooting**

### AWS Credentials
Make sure your AWS credentials are configured:
```bash
aws configure
# Or use environment variables, IAM roles, etc.
```

### Kubernetes Access
Ensure kubectl is configured for your cluster:
```bash
kubectl config current-context
kubectl get pods  # Should work without errors
```

### Node Version
Use the exact Node.js version specified:
```bash
node --version  # Should be 18.19.1
```

### pnpm Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules */node_modules
pnpm install
```

### TypeScript Compilation
```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Build with verbose output
pnpm build --verbose
```

### AWS CDK Issues
```bash
# Bootstrap CDK (first time only)
npx cdk bootstrap

# Check CDK version
npx cdk --version
```

---
📋 **Navigation:** [← Back to README](../README.md) | [Technical Overview →](TECHNICAL_OVERVIEW.md)