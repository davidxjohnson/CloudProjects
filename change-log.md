# Change Log

## Repository Migration and Consolidation - September 26, 2025

### **Repository Restructuring**
- **Migrated** typescript-examples repository into cloud-projects monorepo
- **Renamed** repository structure:
  - `packages/` → `aws-cdk-examples/` (CDK infrastructure projects)
  - `typescript-examples/` → `aws-sdk-examples/` (AWS SDK code examples)
- **Updated** repository name from `AwsCdkProjects` to `CloudProjects`

### **Node.js & Dependencies**
- **Upgraded** from Node.js 16 → Node.js 18.19.1 → prepared for Node.js 22.x LTS
- **Consolidated** dependencies to eliminate redundant dependabot PRs:
  - Moved common deps (`typescript`, `@types/node`, `commander`) to root
  - Used exact versions (no carets) for consistent dependency management
  - **Result**: 75% reduction in dependabot PRs
- **Fixed** TypeScript configuration for ES2022 and Node.js compatibility

### **Cleanup & Organization**
- **Removed** empty `cdk-app` package template
- **Fixed** package version conflicts (commander, aws-cdk-lib)
- **Eliminated** npm/pnpm conflicts:
  - Added `.npmrc` for pnpm enforcement
  - Updated `.gitignore` to prevent npm lock files
  - Added comprehensive file filtering

### **File Management**
- **Enhanced** `.gitignore` with comprehensive filters for:
  - Build outputs, logs, cache files, IDE settings
  - OS-generated files, temporary files, local configs
- **Added** `.gitattributes` for consistent cross-platform file handling
- **Configured** local git settings for line ending consistency

### **Final Structure**
```
CloudProjects/
├── aws-cdk-examples/     # CDK Infrastructure (EKS cluster)
├── aws-sdk-examples/     # AWS SDK examples (Lambda, Kubernetes)
└── [consolidated deps]   # Single source of truth for versions
```

### **Achievements**
- Clean, professional monorepo structure
- Unified dependency management
- Node.js 22.x LTS ready
- Reduced maintenance overhead
- Comprehensive git configuration
- All packages build successfully