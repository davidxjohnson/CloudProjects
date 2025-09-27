#!/bin/bash

# CloudProjects - Create Feature Branch Script
# Usage: ./scripts/create-feature-branch.sh <branch-name> [description]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if branch name is provided
if [ -z "$1" ]; then
    print_error "Branch name is required!"
    echo "Usage: $0 <branch-name> [description]"
    echo "Example: $0 feature/add-s3-example \"Add S3 bucket management example\""
    exit 1
fi

BRANCH_NAME="$1"
DESCRIPTION="${2:-}"

# Validate branch name format
if [[ ! $BRANCH_NAME =~ ^(feature|bugfix|hotfix|chore)/.+ ]]; then
    print_warning "Consider using a conventional branch name format:"
    echo "  - feature/your-feature-name"
    echo "  - bugfix/your-bug-fix"
    echo "  - hotfix/critical-fix"
    echo "  - chore/maintenance-task"
    echo ""
    read -p "Continue with '$BRANCH_NAME'? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Branch creation cancelled"
        exit 1
    fi
fi

print_status "Setting up feature branch workflow..."

# Ensure we're in the git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository!"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Current branch is '$CURRENT_BRANCH', not 'main'"
    read -p "Switch to main branch first? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_status "Continuing from current branch..."
    else
        print_status "Switching to main branch..."
        git checkout main
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes!"
    echo "Please commit or stash your changes before creating a new branch."
    echo ""
    echo "Uncommitted changes:"
    git status --porcelain
    exit 1
fi

# Pull latest changes from origin
print_status "Pulling latest changes from origin..."
if git remote | grep -q "origin"; then
    git pull origin main
    print_success "Updated main branch"
else
    print_warning "No remote 'origin' found, working with local repository only"
fi

# Check if branch already exists
if git branch --list | grep -q "$BRANCH_NAME"; then
    print_error "Branch '$BRANCH_NAME' already exists!"
    echo "Use: git checkout $BRANCH_NAME"
    exit 1
fi

# Create and checkout the new branch
print_status "Creating branch '$BRANCH_NAME'..."
git checkout -b "$BRANCH_NAME"
print_success "Created and switched to branch '$BRANCH_NAME'"

# Create branch tracking file for documentation
BRANCH_INFO_FILE=".git/branch-info.txt"
cat > "$BRANCH_INFO_FILE" << EOF
Branch: $BRANCH_NAME
Created: $(date)
Description: $DESCRIPTION
Base: main ($(git rev-parse --short HEAD))

Workflow:
1. Make your changes
2. Test locally: npm run validate-local.sh
3. Commit: git add . && git commit -m "your message"
4. Push: git push -u origin $BRANCH_NAME
5. Create PR on GitHub
6. Wait for CI/CD to pass
7. Request review if needed
8. Merge when approved
EOF

print_success "Branch information saved to $BRANCH_INFO_FILE"

echo ""
print_status "🚀 Ready for development!"
echo "Current branch: $(git branch --show-current)"
echo ""
print_status "Next steps:"
echo "1. Make your changes"
echo "2. Test locally: bash scripts/validate-local.sh"
echo "3. Commit: git add . && git commit -m 'feat: your change description'"
echo "4. Push: git push -u origin $BRANCH_NAME" 
echo "5. Create pull request on GitHub"
echo ""
print_status "When ready to create PR:"
echo "GitHub URL: https://github.com/davidxjohnson/CloudProjects/compare/$BRANCH_NAME"

# Show current status
echo ""
print_status "Current repository status:"
git status --short