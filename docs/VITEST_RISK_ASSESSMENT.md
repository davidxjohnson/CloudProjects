# Vitest Risk Assessment for Critical Projects

## Strengths
- Fast, modern, Vite-native test runner for TypeScript/ESM.
- Excellent developer experience for small/medium projects and rapid prototyping.
- Active development and feature growth.

## Risks
- **Frequent Breaking Changes:** Major releases often include refactors and breaking changes, requiring significant test and mock rewrites.
- **Mocking Complexity:** ESM/SSR mocking and `vi.mock` behavior can be brittle, especially with complex dependencies or dynamic imports.
- **Documentation Lag:** Migration guides and changelogs may not cover all edge cases, leading to unexpected upgrade pain.
- **Ecosystem Maturity:** Not as battle-tested as Jest, Mocha, or Jasmine for large monorepos or legacy codebases.
- **Plugin Stability:** Coverage, UI, and other plugins may lag behind core changes, causing compatibility issues.

## Mitigations
- Pin Vitest and plugins to a known stable version.
- Isolate test upgrades in feature branches and CI.
- Maintain a migration checklist and test coverage reports.
- Consider Jest or other mature frameworks for business-critical or legacy projects.

## Recommendation
Vitest is excellent for modern, greenfield TypeScript/Vite projects. For mission-critical, long-lived, or legacy codebases, consider using Jest or another stable, widely adopted test framework to minimize upgrade risk and maintenance burden.
