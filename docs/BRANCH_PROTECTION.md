# Branch Protection Setup Guide

This guide will help you set up branch protection rules on GitHub to enforce the pull request workflow and prevent direct pushes to main.

## 🛡️ Setting Up Branch Protection Rules

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub: https://github.com/davidxjohnson/CloudProjects
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Click **Add branch protection rule**

### Step 2: Configure Protection Rule for `main` branch

#### Basic Settings:
- **Branch name pattern**: `main`
- ✅ **Restrict pushes that create files larger than 100 MB**

#### Pull Request Requirements:
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals** (set to 1 if you want self-approval, or 0 for solo work)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have CODEOWNERS file)

#### Status Check Requirements:
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required status checks** (select these from your CI/CD pipeline):
  - `Setup Dependencies`
  - `Lint & Format Check` 
  - `Build All Packages`
  - `Test & Coverage`
  - `Security Audit`
  - `Quality Gate` (if present)

#### Additional Restrictions:
- ✅ **Require signed commits** (recommended for security)
- ✅ **Require linear history** (optional, keeps clean git history)
- ✅ **Include administrators** (applies rules to repo admins too)
- ✅ **Allow force pushes** → **❌ Disable** (prevents force push to main)
- ✅ **Allow deletions** → **❌ Disable** (prevents accidental deletion)

### Step 3: Save Protection Rules

Click **Create** to save your branch protection rules.

## 🚀 New Workflow Process

### Quick Start Commands

```bash
# Start new feature
./scripts/pr-workflow.sh start feature/my-awesome-feature

# Validate changes locally  
./scripts/pr-workflow.sh validate

# Commit your changes
git add .
git commit -m "feat: add awesome feature"

# Push and get PR link
./scripts/pr-workflow.sh push

# Check status anytime
./scripts/pr-workflow.sh status

# Clean up old branches
./scripts/pr-workflow.sh cleanup
```

### Detailed Workflow

1. **Create Feature Branch**:
   ```bash
   ./scripts/pr-workflow.sh start feature/your-feature-name
   ```

2. **Make Your Changes**: Edit code, add features, fix bugs

3. **Test Locally**: Always validate before pushing
   ```bash
   ./scripts/pr-workflow.sh validate
   ```

4. **Commit Changes**: Use conventional commit messages
   ```bash
   git add .
   git commit -m "feat: add new S3 example with error handling"
   ```

5. **Push Branch**: This will give you a PR creation link
   ```bash
   ./scripts/pr-workflow.sh push
   ```

6. **Create Pull Request**: Use the provided GitHub link

7. **Wait for CI/CD**: All checks must pass:
   - ✅ Linting and formatting
   - ✅ Build successful 
   - ✅ All tests pass with coverage
   - ✅ Security audit clean
   - ✅ Quality gate passed

8. **Review & Merge**: Once approved, merge the PR

9. **Clean Up**: Remove merged branches
   ```bash
   ./scripts/pr-workflow.sh cleanup
   ```

## 🔒 What Branch Protection Prevents

Once enabled, branch protection will:

- ❌ **Block direct pushes to main**: Forces use of pull requests
- ❌ **Prevent merging failing PRs**: All CI/CD checks must pass
- ❌ **Stop force pushes**: Protects against history rewriting
- ❌ **Block admin overrides**: Even admins follow the rules
- ✅ **Ensure code review**: Maintains code quality
- ✅ **Require up-to-date branches**: Prevents merge conflicts

## 📋 Commit Message Conventions

Use conventional commit format for consistency:

- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation changes
- `style:` - Code style/formatting
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

Examples:
```
feat: add S3 bucket creation example
fix: handle missing AWS credentials gracefully  
docs: update README with new examples
test: add comprehensive mocking for EKS calls
```

## 🆘 Emergency Procedures

If you need to make urgent changes and CI is failing:

1. **Investigate First**: Check what's actually failing
2. **Fix in Branch**: Create a hotfix branch to address the issue
3. **Temporary Admin Override**: Only if absolutely necessary
4. **Restore Protection**: Re-enable rules immediately after

## ⚡ Pro Tips

- Use `./scripts/pr-workflow.sh status` to check current state
- Always run `./scripts/pr-workflow.sh validate` before pushing
- Create descriptive PR titles and descriptions
- Link related issues in PR description
- Use draft PRs for work-in-progress
- Clean up merged branches regularly

This workflow ensures code quality, prevents broken main branch, and maintains a professional development process even for solo projects!