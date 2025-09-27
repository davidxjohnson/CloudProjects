#!/bin/bash

# CloudProjects - PR Workflow Helper
# Usage: ./scripts/pr-workflow.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to show help
show_help() {
    echo "CloudProjects PR Workflow Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start <branch-name>  - Create a new feature branch"
    echo "  validate            - Run local validation before pushing"
    echo "  push                - Push changes and show PR creation link"
    echo "  status              - Show current branch and status"
    echo "  cleanup             - Clean up merged branches"
    echo "  help                - Show this help message"
    echo ""
    echo "Full workflow example:"
    echo "  $0 start feature/my-awesome-feature"
    echo "  # Make your changes..."
    echo "  $0 validate"
    echo "  git add ."
    echo "  git commit -m 'feat: add awesome feature'"
    echo "  $0 push"
    echo "  # Create PR on GitHub using the provided link"
}

# Function to validate before pushing
validate_changes() {
    print_status "Running local validation..."
    
    if [ -f "scripts/validate-local.sh" ]; then
        bash scripts/validate-local.sh
    else
        print_warning "validate-local.sh not found, running basic checks..."
        
        # Basic validation
        print_status "Installing dependencies..."
        pnpm install
        
        print_status "Building packages..."
        pnpm -r build
        
        print_status "Running tests..."
        pnpm -r test
        
        print_status "Security audit..."
        pnpm audit
    fi
    
    print_success "Local validation completed!"
}

# Function to push and create PR
push_and_create_pr() {
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_error "Cannot push directly to main branch!"
        echo "Create a feature branch first: $0 start feature/your-feature-name"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes!"
        echo "Commit them first: git add . && git commit -m 'your message'"
        git status --porcelain
        exit 1
    fi
    
    # Push the branch
    print_status "Pushing branch '$CURRENT_BRANCH' to origin..."
    git push -u origin "$CURRENT_BRANCH"
    print_success "Branch pushed successfully!"
    
    # Provide PR creation link
    echo ""
    print_status "🎉 Ready to create Pull Request!"
    echo "Click here to create PR: https://github.com/davidxjohnson/CloudProjects/compare/$CURRENT_BRANCH"
    echo ""
    print_status "PR will trigger:"
    echo "✅ Automated testing and validation"
    echo "✅ Code coverage analysis" 
    echo "✅ Security audit"
    echo "✅ Build verification"
    echo ""
    print_status "Make sure to:"
    echo "1. Add descriptive PR title and description"
    echo "2. Link any related issues"
    echo "3. Wait for CI/CD checks to pass"
    echo "4. Request review if needed"
}

# Function to show current status
show_status() {
    CURRENT_BRANCH=$(git branch --show-current)
    
    echo "📋 Repository Status"
    echo "==================="
    echo "Current branch: $CURRENT_BRANCH"
    echo "Repository: CloudProjects"
    echo ""
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_warning "You're on the main branch!"
        echo "Create a feature branch: $0 start feature/your-feature-name"
    else
        print_success "Working on feature branch: $CURRENT_BRANCH"
    fi
    
    echo ""
    echo "Git Status:"
    git status --short
    
    echo ""
    echo "Recent commits:"
    git log --oneline -5
}

# Function to cleanup merged branches
cleanup_branches() {
    print_status "Cleaning up merged branches..."
    
    # Fetch latest changes
    git fetch origin
    
    # Switch to main
    git checkout main
    git pull origin main
    
    # Find merged branches (excluding main)
    MERGED_BRANCHES=$(git branch --merged | grep -v "main" | grep -v "\*" | xargs -n 1)
    
    if [ -z "$MERGED_BRANCHES" ]; then
        print_success "No merged branches to clean up"
        return 0
    fi
    
    echo "Merged branches found:"
    echo "$MERGED_BRANCHES"
    echo ""
    
    read -p "Delete these merged branches? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$MERGED_BRANCHES" | xargs -n 1 git branch -d
        print_success "Cleaned up merged branches"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-help}" in
    "start")
        if [ -z "$2" ]; then
            print_error "Branch name required!"
            echo "Usage: $0 start <branch-name>"
            exit 1
        fi
        bash scripts/create-feature-branch.sh "$2" "$3"
        ;;
    "validate")
        validate_changes
        ;;
    "push")
        push_and_create_pr
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup_branches
        ;;
    "help"|*)
        show_help
        ;;
esac