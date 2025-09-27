# GitHub Branch Protection Rules Configuration
# This file documents the recommended branch protection settings
# These need to be configured in the GitHub repository settings

## Main Branch Protection Rules

### Required Status Checks
- CI/CD Pipeline / setup
- CI/CD Pipeline / lint
- CI/CD Pipeline / build
- CI/CD Pipeline / test
- CI/CD Pipeline / security  
- CI/CD Pipeline / quality-gate
- Pull Request Validation / pr-validation
- Pull Request Validation / comprehensive-tests
- Pull Request Validation / pr-ready

### Branch Protection Settings

**Branch**: `main`

#### Protect matching branches:
- [x] Restrict pushes that create files larger than 100 MB
- [x] Require a pull request before merging
  - [x] Require approvals (minimum: 1)
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from code owners (if CODEOWNERS file exists)
  - [x] Restrict dismissals (repository administrators only)
  - [x] Allow specified actors to bypass required pull requests (none)

#### Require status checks to pass before merging:
- [x] Require branches to be up to date before merging
- [x] Status checks that are required:
  - `CI/CD Pipeline / lint`
  - `CI/CD Pipeline / build (aws-cdk-examples/eks)`
  - `CI/CD Pipeline / build (aws-sdk-examples/list-lambdas)`  
  - `CI/CD Pipeline / build (aws-sdk-examples/list-pods)`
  - `CI/CD Pipeline / test (list-pods)`
  - `CI/CD Pipeline / security`
  - `Pull Request Validation / comprehensive-tests (list-pods-comprehensive)`

#### Additional restrictions:
- [x] Restrict pushes that create files larger than 100 MB
- [x] Include administrators (applies rules to repository administrators)
- [x] Allow force pushes (disabled)
- [x] Allow deletions (disabled)

### Develop Branch Protection (Optional)

**Branch**: `develop` 

#### Lighter protection for development:
- [x] Require a pull request before merging
  - [x] Require approvals (minimum: 1)
  - [ ] Dismiss stale PR approvals when new commits are pushed
- [x] Require status checks to pass before merging:
  - `CI/CD Pipeline / test (list-pods)`
  - `CI/CD Pipeline / build (aws-sdk-examples/list-pods)`

---

## Setup Instructions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or **Edit** existing rule for `main` branch
4. Configure the settings as documented above
5. Save the branch protection rule

## Code Coverage Requirements

The pipeline enforces these coverage thresholds:
- **list-pods**: 95% minimum (currently achieving 97.61%)
- **list-lambdas**: 50% minimum (to be implemented)

## Security Requirements

- No high-severity vulnerabilities allowed
- Dependency audit must pass
- All security checks must pass before merge

## Quality Gates

All PRs must pass:
1. **Linting** - Code style and quality checks
2. **Building** - All packages must build successfully  
3. **Testing** - All tests must pass with mocking
4. **Coverage** - Must meet minimum thresholds
5. **Security** - No critical vulnerabilities
6. **Validation** - PR title format and conflict checks