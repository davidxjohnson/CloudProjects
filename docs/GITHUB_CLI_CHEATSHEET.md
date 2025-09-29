# GitHub CLI (gh) Cheatsheet

*Essential commands for daily Git/GitHub workflows*

## Table of Contents
1. [Setup & Authentication](#setup--authentication)
2. [Repository Management](#repository-management)
3. [Branch Operations](#branch-operations)
4. [Pull Request Workflows](#pull-request-workflows)
5. [Issue Management](#issue-management)
6. [Advanced Operations](#advanced-operations)
7. [Common Workflow Patterns](#common-workflow-patterns)

---

## Setup & Authentication

### Initial Setup
```bash
# Install GitHub CLI (if not already installed)
# Ubuntu/Debian: apt install gh
# macOS: brew install gh

# Authenticate with GitHub
gh auth login
# Follow prompts to authenticate via browser or token

# Check authentication status
gh auth status

# Set default editor for PR descriptions
gh config set editor "code --wait"  # VS Code
gh config set editor "vim"          # Vim
```

### Configuration
```bash
# View current configuration
gh config list

# Set default clone protocol
gh config set git_protocol https  # or ssh
```

---

## Repository Management

### Repository Operations
```bash
# Clone repository with GitHub CLI (sets up origin correctly)
gh repo clone owner/repo-name

# Create new repository
gh repo create my-new-repo --public
gh repo create my-new-repo --private
gh repo create my-new-repo --clone  # Create and clone

# View repository info
gh repo view
gh repo view owner/repo-name

# Fork repository
gh repo fork owner/repo-name
gh repo fork owner/repo-name --clone
```

---

## Branch Operations

### Branch Management
```bash
# List remote branches (useful for cleanup)
gh api repos/:owner/:repo/branches --jq '.[].name'

# Delete remote branch after merge
git push origin --delete branch-name
# or
gh api --method DELETE repos/:owner/:repo/git/refs/heads/branch-name

# List all branches (local and remote)
git branch -a
```

### Our Common Branch Workflow
```bash
# 1. Start feature work
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Work and commit
git add .
git commit -m "feat: implement new feature"

# 3. Push and create PR
git push -u origin feature/my-feature
gh pr create --title "feat: implement new feature" --body "Description here"

# 4. After PR merge, cleanup
git checkout main
git pull origin main
git branch -d feature/my-feature  # Delete local branch
```

---

## Pull Request Workflows

### Creating Pull Requests
```bash
# Basic PR creation
gh pr create

# PR with title and body
gh pr create --title "fix: resolve dependency issue" --body "Fixes #123"

# PR to specific branch (not main)
gh pr create --base develop

# Draft PR
gh pr create --draft

# PR with reviewer assignment
gh pr create --reviewer username1,username2

# PR with labels
gh pr create --label bug,urgent
```

### Managing Pull Requests
```bash
# List PRs
gh pr list
gh pr list --state open
gh pr list --author @me
gh pr list --assignee username

# View PR details
gh pr view 123
gh pr view 123 --web  # Open in browser

# Check PR status
gh pr status
gh pr checks 123

# Merge PR (various strategies)
gh pr merge 123 --merge      # Standard merge
gh pr merge 123 --squash     # Squash and merge
gh pr merge 123 --rebase     # Rebase and merge

# Auto-merge when checks pass
gh pr merge 123 --auto --squash

# Close PR without merging
gh pr close 123
```

### PR Reviews
```bash
# Review PR
gh pr review 123 --approve
gh pr review 123 --request-changes --body "Please fix the linting errors"
gh pr review 123 --comment --body "Looks good overall"

# Check PR reviews
gh pr view 123 --json reviews
```

### Our Real-World Examples
```bash
# What we did for commander fix
gh pr create --title "fix(deps): ignore vitest v3.x to prevent engine compatibility issues" \
             --body "Fixes failing Dependabot PRs with ERR_PNPM_UNSUPPORTED_ENGINE errors"

# Check status of our PR
gh pr status

# Merge after CI passes
gh pr merge --squash
```

---

## Issue Management

### Working with Issues
```bash
# List issues
gh issue list
gh issue list --state open
gh issue list --author @me
gh issue list --label bug

# Create issue
gh issue create --title "Bug: dependency conflict" --body "Description of the issue"

# View issue
gh issue view 456

# Close issue
gh issue close 456

# Reopen issue
gh issue reopen 456
```

---

## Advanced Operations

### Workflows & Actions
```bash
# List workflow runs
gh run list

# View specific run
gh run view 12345

# Watch workflow run (live updates)
gh run watch 12345

# Re-run failed jobs
gh run rerun 12345
```

### Repository Settings
```bash
# Enable/disable features
gh api repos/:owner/:repo --method PATCH --field has_issues=true
gh api repos/:owner/:repo --method PATCH --field has_wiki=false

# Branch protection (what we used for main branch)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field 'required_status_checks[strict]=true' \
  --field 'required_status_checks[contexts][]=build' \
  --field 'enforce_admins=false' \
  --field 'required_pull_request_reviews[required_approving_review_count]=0'
```

### Releases
```bash
# Create release
gh release create v1.0.0 --title "Version 1.0.0" --notes "Release notes here"

# List releases
gh release list

# View release
gh release view v1.0.0
```

---

## Common Workflow Patterns

### Pattern 1: Feature Development (Our Standard)
```bash
# Start feature
git checkout main && git pull origin main
git checkout -b feature/new-feature

# Development work...
git add . && git commit -m "feat: implement feature"

# Push and create PR
git push -u origin feature/new-feature
gh pr create --title "feat: implement new feature"

# After review and merge
git checkout main && git pull origin main
git branch -d feature/new-feature
```

### Pattern 2: Hotfix Workflow
```bash
# Emergency fix
git checkout main && git pull origin main
git checkout -b hotfix/critical-bug

# Quick fix...
git add . && git commit -m "fix: resolve critical bug"

# Fast-track PR
git push -u origin hotfix/critical-bug
gh pr create --title "hotfix: resolve critical bug" --label urgent
gh pr merge --auto --squash  # Auto-merge when checks pass

# Cleanup
git checkout main && git pull origin main
git branch -d hotfix/critical-bug
```

### Pattern 3: Dependabot Management (What We Built)
```bash
# Check for dependabot PRs
gh pr list --author app/dependabot

# Review dependabot PR
gh pr view 14  # Check what's being updated

# If compatible, merge
gh pr merge 14 --squash

# If problematic, close with comment
gh pr close 14 --comment "Closing due to engine compatibility issues. Added ignore rule in dependabot.yml"
```

### Pattern 4: Release Preparation
```bash
# Check what's changed since last release
gh pr list --state merged --base main

# Create release branch
git checkout -b release/v1.2.0

# Update version, CHANGELOG, etc.
git add . && git commit -m "chore: prepare v1.2.0 release"

# Create PR for release
gh pr create --title "chore: release v1.2.0" --base main

# After merge, create tag and release
git checkout main && git pull origin main
git tag v1.2.0
git push origin v1.2.0
gh release create v1.2.0 --generate-notes
```

---

## Troubleshooting Common Issues

### Authentication Problems
```bash
# Re-authenticate
gh auth logout
gh auth login

# Check token permissions
gh auth status --show-token
```

### PR Issues
```bash
# Can't merge? Check status
gh pr checks 123
gh pr view 123 --json mergeable

# Rebase PR if needed
git checkout feature-branch
git rebase main
git push --force-with-lease
```

### Branch Cleanup
```bash
# Delete multiple local branches that are merged
git branch --merged main | grep -v main | xargs -n 1 git branch -d

# List remote branches that can be cleaned up
gh pr list --state merged --json number,headRefName --jq '.[] | .headRefName'
```

---

## Power User Tips

### Aliases and Shortcuts
```bash
# Set up useful aliases
gh alias set prc 'pr create --draft'
gh alias set prm 'pr merge --squash --delete-branch'
gh alias set prl 'pr list --author @me'

# Use aliases
gh prc  # Creates draft PR
gh prm 123  # Squash merges and deletes branch
```

### JSON Output for Scripting
```bash
# Get PR info as JSON
gh pr view 123 --json title,number,state,mergeable

# List all open PRs with custom fields
gh pr list --json number,title,author --jq '.[] | "\(.number): \(.title) by \(.author.login)"'

# Check if PR is ready to merge
gh pr view 123 --json mergeable,statusCheckRollupState
```

### Environment Variables
```bash
# Set default repository (useful in CI)
export GH_REPO="owner/repo-name"

# Use token authentication in CI
export GH_TOKEN="ghp_xxxxxxxxxxxx"

# Check if we're in a repository
gh repo view 2>/dev/null && echo "In a GitHub repo" || echo "Not in a GitHub repo"
```

---

## Integration with Our Project Workflows

### Dependabot Management Script Integration
```bash
# Check for dependabot PRs in our management script
DEPENDABOT_PRS=$(gh pr list --author app/dependabot --state open --json number --jq '.[].number')

# Auto-merge compatible updates
for pr in $DEPENDABOT_PRS; do
  if gh pr checks $pr --json state --jq '.[] | select(.state != "SUCCESS")' | grep -q .; then
    echo "PR $pr has failing checks, skipping"
  else
    gh pr merge $pr --squash
  fi
done
```

### CI/CD Integration
```bash
# In GitHub Actions, use GITHUB_TOKEN
- name: Create PR
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh pr create --title "Automated update" --body "Generated by workflow"
```

---

## Quick Reference Card

```bash
# Most common commands we use:
gh pr list                    # See open PRs
gh pr create                  # Create PR from current branch
gh pr view 123                # View PR details
gh pr merge 123 --squash      # Squash and merge
gh pr close 123               # Close without merging

gh repo view                  # Repository info
gh issue list                 # List issues

gh run list                   # Workflow runs
gh run watch 123              # Watch workflow

# Our typical workflow:
git checkout -b feature/name
# ... work ...
git push -u origin feature/name
gh pr create
# ... review ...
gh pr merge --squash
git checkout main && git pull
git branch -d feature/name
```

---

*Last updated: September 2025 - Based on CloudProjects repository management experience*