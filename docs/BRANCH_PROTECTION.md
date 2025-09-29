# Branch Protection Settings

## Configured Protections in `main` branch

### Essential Branch Settings:
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Include administrators** (applies rules to repo admins too)
- ❌ **Allow force pushes** (prevents force push to main)
- ❌ **Allow deletions** (prevents accidental deletion)

### Required PR Checks:
The CI/CD pipeline(s) have the following checks that must pass before merge to main:
- `Lint & Format Check`
- `Build All Packages` 
- `Test & Coverage`
- `Security Audit`
- `Quality Gate`

## 🤖 Dependabot Auto-merge Integration

This repository includes intelligent Dependabot management that automatically:
- **Disables auto-merge** on Dependabot PRs when feature PRs are active (prevents conflicts)
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

This ensures code quality and prevents broken main branch while maintaining automated dependency management!