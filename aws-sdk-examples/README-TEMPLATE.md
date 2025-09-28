# AWS SDK Examples README Template

This template combines the best elements from both `list-pods` and `list-lambdas` README files to create a uniform structure for all aws-sdk-examples.

## Recommended Structure

### 1. **Header & Description** ✅
```markdown
# @cloud-projects/{example-name}

### Description
A [comprehensive] TypeScript example demonstrating how to [specific functionality] using the [@aws-sdk/client-{service}](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-{service}/index.html) module. This example [includes key features like pagination, error handling, CLI interface, and extensive testing].

Part of the CloudProjects monorepo showcasing modern AWS SDK v3 usage patterns with Node.js.
```

### 2. **What Makes This Example Notable** ✅
**From list-pods** (comprehensive, professional tone):
- Modern TypeScript Configuration
- Professional Testing with Vitest + coverage %
- Production-Ready Error Handling
- SDK-specific feature (pagination/async features)
- Command-Line Interface
- Monorepo Integration

**From list-lambdas** (concise, focused):
- SDK v3 specific improvements (async, pagination)
- TypeScript best practices
- Comprehensive Testing Suite

**Recommended combination**:
```markdown
### What makes this example notable?

* **AWS SDK v3 Benefits** - [SDK-specific improvements like async/await, improved pagination]

* **Modern TypeScript Configuration** - ES2022 with ES modules, strict typing throughout

* **Professional Testing with Vitest** - Comprehensive testing achieving X% coverage with Y passing tests

* **Production-Ready Features** - [Error handling, CLI interface, specific SDK features]
```

### 3. **Prerequisites** (from list-pods) ✅
Clear, specific requirements

### 4. **Installation & Setup** ✅
**Standardized across monorepo** (no need to repeat):
```markdown
## Installation & Setup

From the monorepo root:
```bash
pnpm install
```

Or from this directory:
```bash
cd aws-sdk-examples/{example-name}
pnpm install
```

## Usage
```bash
pnpm build
pnpm start [options]
```
```

**Service-specific content only**:
- Command-line options (varies by example)
- Prerequisites (AWS context, kubectl context, etc.)
- Sample runs (example-specific output)

### 5. **Service-Specific Sections** ✅
**Best from list-pods** (much more comprehensive):
- Commands (test, test:watch, test:coverage, test:ui)
- Coverage results with specific numbers
- Test coverage details with checkmarks
- Modern testing architecture explanation

### 6. **Architecture/Development** (from list-pods) ✅
- File structure
- Key design patterns
- VSCode integration tips
- Common issues

## Analysis Summary

### **Keep from list-pods:**
✅ **Comprehensive structure** - More professional, detailed sections
✅ **Prerequisites section** - Clear requirements
✅ **Detailed testing section** - Professional coverage reporting
✅ **Architecture section** - File structure, design patterns
✅ **Development/Common Issues** - Practical troubleshooting

### **Keep from list-lambdas:**
✅ **Concise "notable features"** - More focused bullet points
✅ **AWS SDK v3 specific benefits** - Highlights modern SDK features
✅ **Cleaner sample output** - More readable examples

### **Remove/Standardize:**
❌ **Verbose explanations** - Keep bullets concise like list-lambdas
❌ **Excessive line number references** - Avoid implementation details
❌ **Inconsistent formatting** - Standardize bullet styles

### **Template Sections:**
1. **Header & Description** - Project name, SDK link, key features
2. **What makes this example notable** - 4-5 bullets (service-specific benefits)
3. **Prerequisites** - Service-specific requirements (AWS context, kubectl, etc.)
4. **Installation & Setup** - **STANDARDIZED** (same pnpm commands across all)
5. **Usage** - Service-specific CLI options and sample runs
6. **Testing** - **STANDARDIZED** Vitest commands + service-specific coverage
7. **Architecture** - **STANDARDIZED** file structure + service-specific patterns
8. **Development** - **STANDARDIZED** VSCode tips + service-specific issues

### **Monorepo Benefits:**
✅ **Installation is identical** - Always `pnpm install` from root or directory  
✅ **Testing commands uniform** - `pnpm test`, `pnpm test:coverage`, etc.  
✅ **Build process consistent** - `pnpm build`, `pnpm start`  
✅ **File structure standardized** - src/, dist/, coverage/, vitest.config.ts  
✅ **Dependencies centralized** - TypeScript, Node.js versions consistent  

### **Service-Specific Content:**
🎯 **Prerequisites** - AWS context vs kubectl context  
🎯 **CLI Options** - Different flags per service  
🎯 **Sample Output** - Service-specific responses  
🎯 **Notable Features** - SDK-specific benefits  
🎯 **Common Issues** - Service-specific troubleshooting  

This template provides the comprehensive structure of list-pods with the focused, concise style of list-lambdas.