#!/bin/bash

# Check if npm is being used in the monorepo
if [ -f "package.json" ] && [ -f "../pnpm-workspace.yaml" ] || [ -f "../../pnpm-workspace.yaml" ]; then
    echo "❌ Error: This is a pnpm monorepo workspace!"
    echo "Please use 'pnpm' instead of 'npm' for package management."
    echo ""
    echo "Common commands:"
    echo "  pnpm install          # Install dependencies"
    echo "  pnpm build            # Build the project"
    echo "  pnpm start            # Start the project"
    echo "  pnpm --filter <pkg>   # Run commands on specific packages"
    echo ""
    exit 1
fi