#!/bin/bash

# Dependabot Auto-merge Management Script
# This script manages Dependabot auto-merge based on the presence of non-Dependabot PRs

set -e

# Configuration
REPO_OWNER="davidxjohnson"
REPO_NAME="CloudProjects"
WORKFLOW_FILE=".github/workflows/ci.yml"
TEMP_BRANCH="temp-dependabot-automerge-$(date +%s)"
FLAG_FILE=".dependabot-disabled"

# Dependabot waiting threshold (7 days)
DEPENDABOT_WAITING_THRESHOLD_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is available
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi

    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
}

# Get all open PRs
get_open_prs() {
    gh pr list --repo "$REPO_OWNER/$REPO_NAME" --state open --json number,author,title,headRefName
}

# Check if there are non-Dependabot PRs
has_non_dependabot_prs() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login != "dependabot[bot]") | .number' | wc -l
}

# Check if there are Dependabot PRs
has_dependabot_prs() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login == "dependabot[bot]") | .number' | wc -l
}

# Get Dependabot PRs
get_dependabot_prs() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login == "dependabot[bot]") | "\(.number) \(.title)"'
}

# Get Dependabot PR numbers only
get_dependabot_pr_numbers() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login == "dependabot[bot]") | .number'
}

# Get Dependabot PRs with creation date
get_dependabot_prs_with_age() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login == "dependabot[bot]") | "\(.number) \(.title) \(.createdAt)"'
}

# Check if Dependabot PR has been waiting too long
check_dependabot_waiting_time() {
    local pr_created_at="$1"
    local current_date=$(date -u +%s)
    local pr_date=$(date -u -d "$pr_created_at" +%s)
    local days_waiting=$(( (current_date - pr_date) / 86400 ))
    
    echo $days_waiting
}

# Get Dependabot PRs that need rebasing due to long wait
get_dependabot_prs_needing_rebase() {
    local prs_with_age=$(get_dependabot_prs_with_age)
    local prs_needing_rebase=""
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            local pr_number=$(echo "$line" | cut -d' ' -f1)
            local pr_created_at=$(echo "$line" | rev | cut -d' ' -f1 | rev)
            local days_waiting=$(check_dependabot_waiting_time "$pr_created_at")
            
            if [ "$days_waiting" -ge "$DEPENDABOT_WAITING_THRESHOLD_DAYS" ]; then
                if [ -n "$prs_needing_rebase" ]; then
                    prs_needing_rebase="$prs_needing_rebase\n$pr_number (waiting $days_waiting days)"
                else
                    prs_needing_rebase="$pr_number (waiting $days_waiting days)"
                fi
            fi
        fi
    done <<< "$prs_with_age"
    
    echo -e "$prs_needing_rebase"
}

# Update stale Dependabot PRs to latest main
update_dependabot_prs() {
    local pr_numbers=$(get_dependabot_pr_numbers)
    local prs_needing_rebase=$(get_dependabot_prs_needing_rebase)
    
    if [ -z "$pr_numbers" ]; then
        log_info "No Dependabot PRs to update"
        return 0
    fi
    
    log_info "Checking Dependabot PRs for staleness and waiting time..."
    
    if [ -n "$prs_needing_rebase" ]; then
        log_warning "Dependabot PRs that have been waiting $DEPENDABOT_WAITING_THRESHOLD_DAYS+ days:"
        echo -e "$prs_needing_rebase" | while read -r line; do
            if [ -n "$line" ]; then
                echo "  - PR #$line"
            fi
        done
        echo
        
        # Rebase PRs that have been waiting too long
        echo -e "$prs_needing_rebase" | while read -r line; do
            if [ -n "$line" ]; then
                local pr_number=$(echo "$line" | cut -d' ' -f1)
                log_info "Rebasing long-waiting Dependabot PR #$pr_number..."
                gh pr comment $pr_number --repo "$REPO_OWNER/$REPO_NAME" --body "@dependabot rebase" || true
                sleep 2
            fi
        done
    fi
    
    # Also check all Dependabot PRs for general staleness (behind main)
    for pr_number in $pr_numbers; do
        # Skip if we already rebased due to waiting time
        if echo -e "$prs_needing_rebase" | grep -q "^$pr_number "; then
            continue
        fi
        
        log_info "Checking PR #$pr_number for general staleness..."
        
        # Check if PR is behind main by requesting a rebase
        # (This is safer than trying to detect staleness programmatically)
        log_info "Requesting standard rebase for PR #$pr_number..."
        gh pr comment $pr_number --repo "$REPO_OWNER/$REPO_NAME" --body "@dependabot rebase" || true
        
        sleep 2
    done
    
    log_success "Dependabot PR update requests sent"
}

# Get non-Dependabot PRs  
get_non_dependabot_prs() {
    local prs=$(get_open_prs)
    echo "$prs" | jq -r '.[] | select(.author.login != "dependabot[bot]") | "\(.number) \(.title)"'
}

# Check current auto-merge status in workflow
is_automerge_enabled() {
    if grep -q "^  auto-merge-dependabot:" "$WORKFLOW_FILE" && \
       ! grep -q "^  # auto-merge-dependabot:" "$WORKFLOW_FILE"; then
        return 0  # enabled
    else
        return 1  # disabled
    fi
}

# Disable Dependabot auto-merge
disable_automerge() {
    log_info "Disabling Dependabot auto-merge..."
    
    # Create temporary branch for the change
    git checkout -b "$TEMP_BRANCH"
    
    # Comment out the auto-merge job
    sed -i 's/^  auto-merge-dependabot:/  # auto-merge-dependabot:/' "$WORKFLOW_FILE"
    sed -i 's/^    name: Auto-merge Dependabot PRs$/    # name: Auto-merge Dependabot PRs/' "$WORKFLOW_FILE"
    
    # Commit and push the change
    git add "$WORKFLOW_FILE"
    git commit -m "ci: temporarily disable Dependabot auto-merge

- Non-Dependabot PRs are active
- Auto-merge will be re-enabled when all non-Dependabot PRs are resolved
- This ensures stable dependency management during feature development"
    
    git push origin "$TEMP_BRANCH"
    
    # Create PR for the change
    gh pr create --title "ci: temporarily disable Dependabot auto-merge" \
                 --body "🛡️ **Temporary Dependabot Auto-merge Disable**

**Reason:** Non-Dependabot PRs are currently open and active.

**What this does:**
- Disables automatic merging of Dependabot PRs
- Allows stable dependency environment during feature development
- Will be re-enabled automatically when all non-Dependabot PRs are resolved

**Current Status:**
- Non-Dependabot PRs: $(has_non_dependabot_prs)
- Dependabot PRs: $(has_dependabot_prs)

**Next Steps:**
1. Complete and merge non-Dependabot PRs
2. Auto-merge will be automatically re-enabled
3. Dependabot PRs will then process through quality gates" \
                 --head "$TEMP_BRANCH" \
                 --base main
    
    # Switch back to main and clean up
    git checkout main
    git branch -D "$TEMP_BRANCH"
    
    log_success "Dependabot auto-merge disabled via PR"
}

# Enable Dependabot auto-merge
enable_automerge() {
    log_info "Enabling Dependabot auto-merge..."
    
    # Create temporary branch for the change
    git checkout -b "$TEMP_BRANCH"
    
    # Uncomment the auto-merge job
    sed -i 's/^  # auto-merge-dependabot:/  auto-merge-dependabot:/' "$WORKFLOW_FILE"
    sed -i 's/^    # name: Auto-merge Dependabot PRs$/    name: Auto-merge Dependabot PRs/' "$WORKFLOW_FILE"
    
    # Commit and push the change
    git add "$WORKFLOW_FILE"
    git commit -m "ci: re-enable Dependabot auto-merge

- All non-Dependabot PRs have been resolved
- Safe to resume automatic dependency management
- Dependabot PRs will now auto-merge after passing quality gates"
    
    git push origin "$TEMP_BRANCH"
    
    # Create PR for the change
    gh pr create --title "ci: re-enable Dependabot auto-merge" \
                 --body "🚀 **Re-enable Dependabot Auto-merge**

**Reason:** All non-Dependabot PRs have been resolved.

**What this does:**
- Re-enables automatic merging of Dependabot PRs
- Resumes normal dependency management workflow
- Dependabot PRs will auto-merge after passing quality gates

**Current Status:**
- Non-Dependabot PRs: $(has_non_dependabot_prs)
- Dependabot PRs: $(has_dependabot_prs)

**Quality Gates:**
- ✅ Linting must pass
- ✅ Build must succeed  
- ✅ Tests must pass with coverage thresholds
- ✅ Security audit must pass" \
                 --head "$TEMP_BRANCH" \
                 --base main
    
    # Switch back to main and clean up
    git checkout main
    git branch -D "$TEMP_BRANCH"
    
    # Update any stale Dependabot PRs after re-enabling auto-merge
    log_info "Checking for stale Dependabot PRs that need updating..."
    update_dependabot_prs
    
    log_success "Dependabot auto-merge enabled via PR"
}

# Main logic
main() {
    log_info "🤖 Dependabot Auto-merge Management"
    log_info "Repository: $REPO_OWNER/$REPO_NAME"
    echo

    check_gh_cli

    # Get current status
    local non_dependabot_count=$(has_non_dependabot_prs)
    local dependabot_count=$(has_dependabot_prs)
    local automerge_enabled=$(is_automerge_enabled && echo "true" || echo "false")

    log_info "Current Status:"
    echo "  📋 Non-Dependabot PRs: $non_dependabot_count"
    echo "  🤖 Dependabot PRs: $dependabot_count"  
    echo "  🔄 Auto-merge enabled: $automerge_enabled"
    echo

    if [ "$non_dependabot_count" -gt 0 ]; then
        log_warning "Non-Dependabot PRs are active:"
        get_non_dependabot_prs | while read -r line; do
            echo "    - PR #$line"
        done
        echo

        if [ "$automerge_enabled" = "true" ]; then
            log_warning "Auto-merge is currently enabled but should be disabled"
            disable_automerge
        else
            log_info "Auto-merge is already disabled ✅"
        fi

    else
        log_success "No non-Dependabot PRs active"
        
        if [ "$dependabot_count" -gt 0 ]; then
            log_info "Dependabot PRs are waiting:"
            get_dependabot_prs | while read -r line; do
                echo "    - PR #$line"
            done
            echo
            
            # Show PRs that have been waiting too long
            local prs_waiting_too_long=$(get_dependabot_prs_needing_rebase)
            if [ -n "$prs_waiting_too_long" ]; then
                log_warning "⏰ PRs waiting $DEPENDABOT_WAITING_THRESHOLD_DAYS+ days (will be rebased):"
                echo -e "$prs_waiting_too_long" | while read -r line; do
                    if [ -n "$line" ]; then
                        echo "    - PR #$line"
                    fi
                done
                echo
            fi

            if [ "$automerge_enabled" = "false" ]; then
                log_info "Enabling auto-merge for Dependabot PRs"
                enable_automerge
            else
                log_success "Auto-merge is already enabled ✅"
                # Even if auto-merge is enabled, update long-waiting PRs
                if [ -n "$prs_waiting_too_long" ]; then
                    log_info "Updating long-waiting Dependabot PRs..."
                    update_dependabot_prs
                fi
            fi
        else
            log_success "No Dependabot PRs pending"
        fi
    fi

    echo
    log_success "Dependabot management complete!"
}

# Help function
show_help() {
    cat << EOF
Dependabot Auto-merge Management Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --help, -h          Show this help message
    --status            Show current status only (no changes)
    --force-disable     Force disable auto-merge regardless of PR status
    --force-enable      Force enable auto-merge regardless of PR status

DESCRIPTION:
    This script intelligently manages Dependabot auto-merge based on the presence
    of non-Dependabot PRs. It helps maintain stable dependency management during
    active feature development.

WORKFLOW:
    1. If non-Dependabot PRs exist → Disable auto-merge
    2. If only Dependabot PRs exist → Enable auto-merge  
    3. All changes are made via PRs for visibility and review

EXAMPLES:
    $0                  # Run automatic management
    $0 --status         # Check status only
    $0 --force-disable  # Force disable auto-merge
EOF
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --status)
        log_info "Status check only mode"
        check_gh_cli
        non_dependabot_count=$(has_non_dependabot_prs)
        dependabot_count=$(has_dependabot_prs)
        automerge_enabled=$(is_automerge_enabled && echo "true" || echo "false")
        
        echo "📊 Current Status:"
        echo "  📋 Non-Dependabot PRs: $non_dependabot_count"
        echo "  🤖 Dependabot PRs: $dependabot_count"
        echo "  🔄 Auto-merge enabled: $automerge_enabled"
        exit 0
        ;;
    --force-disable)
        log_warning "Force disabling auto-merge"
        check_gh_cli
        disable_automerge
        exit 0
        ;;
    --force-enable)  
        log_warning "Force enabling auto-merge"
        check_gh_cli
        enable_automerge
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac