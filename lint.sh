#!/bin/bash

# Lint TypeScript files across the monorepo
echo "🔍 Running ESLint on TypeScript files..."

# Use pnpm instead of npx for consistency
pnpm exec eslint "**/*.ts" --ignore-pattern "node_modules/**" --ignore-pattern "dist/**" --ignore-pattern "lib/**" --ignore-pattern "cdk.out/**"

echo "✅ Linting completed!"
