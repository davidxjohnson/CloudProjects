# Node.js 20 Compatibility Matrix

*Assessment for CloudProjects monorepo migration*

## Current Status: Node.js 18.19.1

| Package | Current Dependencies | Node 20 Ready? | Blockers | Action Needed |
|---------|---------------------|----------------|----------|---------------|
| **Root Workspace** | | | | |
| TypeScript 5.9.2 | ✅ | Yes | None | None |
| ESLint 9.36.0 | ✅ | Yes | None | None |
| aws-cdk-lib 2.217.0 | 🔍 | TBD | TBD | Test required |
| | | | | |
| **list-lambdas** | | | | |
| commander 13.1.0 | ❌ | No | Needs v14+ | Upgrade after Node 20 |
| vitest 2.1.9 | ❌ | No | Needs v3+ | Upgrade after Node 20 |
| @aws-sdk/client-lambda 3.896.0 | 🔍 | TBD | TBD | Test required |
| | | | | |
| **list-pods** | | | | |
| commander 13.1.0 | ❌ | No | Needs v14+ | Upgrade after Node 20 |
| vitest 2.1.9 | ❌ | No | Needs v3+ | Upgrade after Node 20 |
| | | | | |
| **eks** | | | | |
| aws-cdk-lib 2.217.0 | 🔍 | TBD | TBD | Test required |

## Migration Strategy

### Phase 1: Compatibility Testing (Current)
- [ ] Test each package individually with Node.js 20
- [ ] Identify breaking changes
- [ ] Document required dependency upgrades

### Phase 2: Preparation (Before Migration)
- [ ] Update dependencies that require Node.js 20
- [ ] Remove Dependabot ignore rules for compatible packages
- [ ] Update package.json engines to ">=18.19.1 || >=20.0.0"

### Phase 3: Migration (Single Event)
- [ ] Update CI/CD to Node.js 20
- [ ] Update all local development environments
- [ ] Deploy to staging with Node.js 20
- [ ] Monitor and fix any remaining issues
- [ ] Deploy to production

## Key Insights

**Cannot be gradual because:**
- Single Node.js runtime per monorepo
- Shared node_modules and lockfile
- Single CI/CD environment

**"Gradual" means:**
- Gradual preparation and testing
- Single migration event
- Gradual rollout to environments (dev → staging → prod)

## Decision Points

### Option A: Big Bang Migration
**When:** All packages tested and compatible
**Risk:** High (everything changes at once)
**Benefit:** Fast, clean cut

### Option B: Package Extraction
**When:** Some packages have incompatible dependencies
**Risk:** Medium (complexity of separate repos)
**Benefit:** True gradual migration possible

### Option C: Version Matrix Testing
**When:** Uncertain compatibility
**Risk:** Low (thorough testing)
**Benefit:** High confidence migration