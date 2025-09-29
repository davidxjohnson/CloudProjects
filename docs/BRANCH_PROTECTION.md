# Branch Protection Setup Guide

This guide will help you set up branch protection rules on GitHub to enforce the pull request workflow and prevent direct pushes to main.

## 🛡️ Setting Up Branch Protection Rules

### Configure Protection Rule for `main` branch

1. Go to your repository **Settings** → **Branches** → **Add branch protection rule**
2. Set **Branch name pattern**: `main`
3. Enable these key protections:

#### Essential Settings:
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Include administrators** (applies rules to repo admins too)
- ❌ **Allow force pushes** (prevents force push to main)
- ❌ **Allow deletions** (prevents accidental deletion)

#### Required Status Checks:
Select these from your CI/CD pipeline:
- `Lint & Format Check`
- `Build All Packages` 
- `Test & Coverage`
- `Security Audit`
- `Quality Gate`

## 🤖 Dependabot Auto-merge Integration

This repository includes intelligent Dependabot management that automatically:
- **Disables auto-merge** when feature PRs are active (prevents conflicts)
- **Re-enables auto-merge** when only Dependabot PRs remain
- **Maintains all quality gates** for dependency updates

For detailed information and manual control options, see: [Dependabot Management Guide](DEPENDABOT_MANAGEMENT.md)

## 🚀 Workflow Commands

```bash
# Start new feature
./scripts/pr-workflow.sh start feature/my-feature

# Validate changes locally  
./scripts/pr-workflow.sh validate

# Push and get PR link
./scripts/pr-workflow.sh push

# Check status
./scripts/pr-workflow.sh status

# Clean up merged branches
./scripts/pr-workflow.sh cleanup
```

##  Commit Message Conventions

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `ci:` - CI/CD changes

## 🔒 What Branch Protection Provides

- ✅ **Enforces code review** process
- ✅ **Requires all CI/CD checks** to pass
- ✅ **Prevents direct pushes** to main
- ✅ **Maintains clean git history**
- ✅ **Integrates with Dependabot** auto-merge system

This ensures code quality and prevents broken main branch while maintaining automated dependency management!