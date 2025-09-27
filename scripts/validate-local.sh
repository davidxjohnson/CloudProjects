#!/bin/bash

# Local CI/CD Validation Script
# Run this script to validate your changes before pushing

set -e

echo "🚀 CloudProjects Local CI/CD Validation"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "1. Checking dependencies..."
if command -v pnpm &> /dev/null; then
    print_status 0 "pnpm is installed"
else
    print_status 1 "pnpm is required but not installed"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js is installed ($NODE_VERSION)"
else
    print_status 1 "Node.js is required but not installed"
fi

echo ""
echo "2. Installing dependencies..."
pnpm install --frozen-lockfile
print_status $? "Dependencies installed"

echo ""
echo "3. Running security audit..."
if pnpm audit --audit-level high; then
    print_status 0 "Security audit passed"
else
    print_warning "Security vulnerabilities found - check output above"
fi

echo ""
echo "4. Building all packages..."

# Build aws-cdk-examples/eks
echo "   Building aws-cdk-examples/eks..."
cd aws-cdk-examples/eks
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    pnpm build
    print_status $? "EKS package built"
else
    print_warning "No build script found for EKS package"
fi
cd ../..

# Build aws-sdk-examples/list-lambdas
echo "   Building aws-sdk-examples/list-lambdas..."
cd aws-sdk-examples/list-lambdas
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    pnpm build
    print_status $? "List-lambdas package built"
else
    print_warning "No build script found for list-lambdas package"
fi
cd ../..

# Build aws-sdk-examples/list-pods
echo "   Building aws-sdk-examples/list-pods..."
cd aws-sdk-examples/list-pods
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    pnpm build
    print_status $? "List-pods package built"
else
    print_warning "No build script found for list-pods package"
fi
cd ../..

echo ""
echo "5. Running tests with coverage..."

# Test list-pods (comprehensive)
echo "   Testing list-pods (comprehensive)..."
cd aws-sdk-examples/list-pods
if [ -f "package.json" ] && grep -q '"test:coverage"' package.json; then
    pnpm test:coverage
    print_status $? "List-pods tests passed with coverage"
else
    print_warning "No test:coverage script found for list-pods"
fi
cd ../..

# Test list-lambdas (basic)
echo "   Testing list-lambdas (basic)..."
cd aws-sdk-examples/list-lambdas
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    pnpm test
    print_status $? "List-lambdas tests passed"
else
    print_warning "No test script found for list-lambdas"
fi
cd ../..

echo ""
echo "6. Checking for common issues..."

# Check for .env files (should not be committed)
if find . -name ".env" -not -path "./node_modules/*" | grep -q ".env"; then
    print_status 1 "Found .env files - these should not be committed"
else
    print_status 0 "No .env files found"
fi

# Check for large files
if find . -name "*.log" -o -name "*.tmp" -not -path "./node_modules/*" | grep -q "."; then
    print_warning "Found log or temporary files - consider adding to .gitignore"
else
    print_status 0 "No temporary files found"
fi

# Check for TypeScript compilation errors
echo "   Checking TypeScript compilation..."
if pnpm -r exec tsc --noEmit; then
    print_status 0 "TypeScript compilation clean"
else
    print_status 1 "TypeScript compilation errors found"
fi

echo ""
echo "7. Git status check..."
if git diff --quiet && git diff --staged --quiet; then
    print_status 0 "No uncommitted changes"
else
    print_warning "You have uncommitted changes"
    echo "Uncommitted files:"
    git status --short
fi

echo ""
echo "========================================="
echo -e "${GREEN}🎉 Local validation completed successfully!${NC}"
echo ""
echo "Your changes are ready for:"
echo "1. git add ."
echo "2. git commit -m 'your message'"
echo "3. git push origin your-branch"
echo "4. Create pull request"
echo ""
echo "The CI/CD pipeline will run automatically on your PR!"
echo "========================================="