# Contributing to CloudProjects

Welcome! This guide will help you contribute to the CloudProjects monorepo effectively.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 22.20.0 or higher (LTS recommended)
- **pnpm**: 10.14.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended with TypeScript extension

### Development Setup
```bash
# Clone the repository
git clone https://github.com/davidxjohnson/CloudProjects.git
cd CloudProjects

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 🏗️ Project Structure

```
CloudProjects/
├── aws-cdk-examples/          # CDK infrastructure examples
│   └── eks/                   # EKS cluster example
├── aws-sdk-examples/          # AWS SDK usage examples
│   ├── list-lambdas/          # Lambda listing example
│   └── list-pods/             # Kubernetes pod listing (comprehensive testing)
├── .github/                   # CI/CD workflows and templates
├── package.json               # Root workspace configuration
└── pnpm-workspace.yaml        # pnpm monorepo configuration
```

## 📝 Development Workflow

### 1. Creating a New Feature/Fix

```bash
# Create a new branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Making Changes

- Follow TypeScript strict mode
- Use exact dependency versions (no caret ranges)
- Include comprehensive tests with mocking
- Update documentation as needed
- Follow existing code patterns

### 3. Testing Requirements

**All changes must include tests with:**
- ✅ **High code coverage** (95% for list-pods, 50% minimum for others)
- ✅ **Comprehensive mocking** of external dependencies
- ✅ **Error scenario testing**
- ✅ **Integration testing** where applicable

```bash
# Run tests for specific package
cd aws-sdk-examples/list-pods
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### 4. Code Quality Standards

#### TypeScript Configuration
- Use ES modules (`"type": "module"`)
- Target ES2022 with Node.js 22.x compatibility
- Strict typing throughout
- No `any` types without justification

#### Testing Standards
- Use **Vitest** for new projects (professional-grade testing)
- Comprehensive mocking with `vi.mock()`
- Test both success and error scenarios
- Include CLI interface testing
- Achieve minimum coverage thresholds

#### Dependencies
- Exact versions only (no `^` or `~`)
- Justify all new dependencies
- Regular security audits
- Keep dependencies up-to-date

### 5. Documentation

All changes should include:
- Updated README.md files
- Code comments for complex logic
- Examples of usage
- API documentation if applicable

## 🧪 Testing Philosophy

### Testing Hierarchy
1. **Unit Tests** - Test individual functions/classes
2. **Integration Tests** - Test component interactions  
3. **End-to-end Tests** - Test complete workflows
4. **Error Handling Tests** - Test failure scenarios

### Mocking Strategy
- **External APIs** - Always mock (AWS, Kubernetes, etc.)
- **File System** - Mock when appropriate
- **Environment Variables** - Mock for consistent testing
- **Time/Dates** - Mock for predictable tests

### Example Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle success scenarios', async () => {
    // Test implementation
  })

  it('should handle error scenarios', async () => {
    // Test error handling
  })
})
```

## 🔄 Pull Request Process

### 1. Before Creating a PR
- [ ] All tests pass locally
- [ ] Code coverage meets thresholds
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Branch is up-to-date with main

### 2. Creating the Pull Request
- Use the provided PR template
- Include clear description of changes
- Reference related issues
- Add appropriate labels
- Request review from code owners

### 3. PR Requirements (Automated)
- ✅ **All status checks pass**
- ✅ **Tests pass with high coverage**
- ✅ **No security vulnerabilities**
- ✅ **Builds succeed for all packages**
- ✅ **No merge conflicts**
- ✅ **Code review approval**

### 4. After PR Approval
- Use "Squash and merge" (recommended)
- Delete the feature branch
- Monitor for any issues

## 🏷️ Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks
- ci: CI/CD changes

Examples:
feat(list-pods): add pagination support
fix(list-lambdas): handle empty response
docs(readme): update installation instructions
test(list-pods): increase coverage to 98%
```

## 🔒 Security Guidelines

### Sensitive Information
- Never commit API keys, credentials, or secrets
- Use environment variables for configuration
- Review dependencies for vulnerabilities
- Follow AWS security best practices

### Code Security
- Validate all inputs
- Handle errors gracefully
- Use parameterized queries if applicable
- Follow principle of least privilege

## 🏆 Code Quality Metrics

### Coverage Thresholds
- **list-pods**: 95% minimum (currently 97.61% ✅)
- **list-lambdas**: 50% minimum
- **New packages**: 70% minimum

### Performance Standards
- Fast build times (< 30 seconds per package)
- Quick test execution (< 10 seconds per suite)
- Minimal bundle sizes
- Efficient dependency usage

## 🐛 Bug Reports

When reporting bugs:
1. Use the issue templates
2. Include reproduction steps
3. Provide environment details
4. Add relevant logs/screenshots
5. Suggest potential solutions

## 💡 Feature Requests

For new features:
1. Check existing issues first
2. Describe the use case
3. Explain the benefits
4. Consider implementation complexity
5. Be open to alternatives

## 🤝 Code Review Guidelines

### For Authors
- Keep PRs focused and small
- Provide clear descriptions
- Respond to feedback promptly
- Test thoroughly before requesting review

### For Reviewers
- Be constructive and specific
- Focus on logic, not style (linter handles that)
- Ask questions to understand intent
- Approve when standards are met

## 📞 Getting Help

- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Security**: Email maintainers privately
- **Documentation**: Check existing docs first

## 🎯 Goals and Vision

This monorepo aims to:
- Provide high-quality TypeScript examples for AWS/cloud services
- Maintain professional-grade testing and CI/CD practices  
- Serve as a reference for modern Node.js development
- Enable rapid prototyping and learning

## 🏅 Recognition

Contributors are recognized through:
- GitHub contributor graphs
- Release notes mentions
- Code owner responsibilities
- Community acknowledgment

Thank you for contributing to CloudProjects! 🚀