---
name: Pull Request
about: Template for all pull requests
title: '[TYPE]: Brief description of changes'
labels: ''
assignees: ''

---

## 📋 Pull Request Summary

### Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Maintenance/refactoring
- [ ] 🧪 Tests only
- [ ] 🏗️ CI/CD changes

### Description
Brief description of what this PR does:

### Related Issues
Closes #(issue number)

## 🧪 Testing

### Test Coverage
- [ ] All new code is covered by tests
- [ ] All existing tests pass
- [ ] Coverage meets minimum thresholds (95% for list-pods, 50% for others)
- [ ] Tests use proper mocking for external dependencies

### Manual Testing
- [ ] Tested locally
- [ ] All examples run successfully
- [ ] Error handling works as expected
- [ ] CLI interfaces work correctly

### Automated Testing
- [ ] All CI checks pass
- [ ] No security vulnerabilities introduced
- [ ] Builds succeed for all packages

## 📦 Changes Made

### Packages Modified
- [ ] `aws-cdk-examples/eks`
- [ ] `aws-sdk-examples/list-lambdas`
- [ ] `aws-sdk-examples/list-pods`
- [ ] Root configuration
- [ ] Documentation only

### Key Changes
- List the main changes made...
- Include any breaking changes...
- Note any new dependencies...

## 🔍 Code Quality

### Standards Compliance
- [ ] Follows TypeScript strict mode
- [ ] Uses exact dependency versions (no caret ranges)
- [ ] Includes proper error handling
- [ ] Has appropriate logging/console output
- [ ] Documentation is updated

### Dependencies
- [ ] No new dependencies added
- [ ] New dependencies justified and approved
- [ ] All dependencies are up-to-date
- [ ] No security vulnerabilities in dependencies

## 📸 Screenshots/Examples (if applicable)

### Before
```bash
# Example of old behavior
```

### After  
```bash
# Example of new behavior
```

## 🚀 Deployment

### Pre-merge Checklist
- [ ] Branch is up to date with main
- [ ] All status checks pass
- [ ] Code review completed and approved
- [ ] No merge conflicts
- [ ] Documentation updated if needed

### Post-merge Actions
- [ ] Monitor for any issues
- [ ] Update dependent projects if needed
- [ ] Create follow-up issues if applicable

## 📝 Additional Notes

Add any additional context, concerns, or notes for reviewers here.

### Breaking Changes
If this PR introduces breaking changes, describe:
1. What breaks
2. How to migrate/update
3. Timeline for deprecation

### Performance Impact
- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance impact assessed and acceptable

---

## 🤖 For Maintainers

### Merge Strategy
- [ ] Merge commit
- [ ] Squash and merge (recommended)
- [ ] Rebase and merge

### Release Notes
- [ ] Include in next release notes
- [ ] Requires version bump
- [ ] No release notes needed