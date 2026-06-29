# Code Style and Conventions

**Last Updated**: 2026-06-30
**Style Guide**: Follows Clean Architecture and SOLID principles

## TypeScript Configuration
- **Strict mode**: Enabled (all strict checks on)
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **ES Modules**: All files use import/export (no require)
- **Types**: @types/node included
- **No implicit any**: All types must be explicit
- **Null checks**: strictNullChecks enabled

## Naming Conventions

### Files
- **kebab-case**: `generate-root-ca.ts`, `edit-agent.ts`, `certificate-authority.ts`
- **Organize by layer**: `core/`, `commands/`, `shared/`, `types/`

### Code Elements
- **Functions**: camelCase (`generateRootCA`, `createAgent`, `issueServerCert`)
- **Classes**: PascalCase (`CertificateAuthority`, `AgentRegistry`, `NATSConfigBuilder`)
- **Interfaces**: PascalCase (`AgentInfo`, `CreateAgentOptions`, `OpenSSLAdapter`)
- **Constants**: UPPER_SNAKE_CASE (`CERTS_DIR`, `CONFIG_DIR`, `DEFAULT_PORT`)
- **Value Objects**: PascalCase (`AgentName`)
- **Adapters**: PascalCase with "Adapter" suffix (`OpenSSLAdapter`, `FilesystemAdapter`)

## Code Organization

### Module Structure
- **One class per file**: `authority.ts` contains only `CertificateAuthority`
- **Related functions grouped**: Validation functions in `validators.ts`
- **Pure schemas separated**: Zod schemas in `schemas.ts`, validators in `validators.ts`
- **Adapters in subdirectories**: `certificates/adapters/openssl.ts`

### Class Design
- **Single Responsibility**: Each class has one clear purpose
- **Constructor injection**: All dependencies injected via constructor
- **Private methods**: Internal helpers marked `private`
- **Immutable state**: No mutable class properties (use readonly where appropriate)

### Function Design
- **Pure functions preferred**: No side effects where possible
- **Explicit side effects**: Side-effectful functions clearly named (e.g., `removeDir`)
- **Small functions**: Aim for <20 lines per function
- **One level of abstraction**: Functions at same abstraction level

### Async/Await
- **Consistent async usage**: Always use async/await, never raw promises
- **Error propagation**: Let errors bubble up, catch at command level
- **No nested callbacks**: Use async/await to flatten promise chains

### Export Pattern
- **Named exports only**: No default exports
- **Export from barrel files**: Use index.ts for public API where appropriate
- **Explicit imports**: Import exactly what you need

## User-Facing Output

### Console Messages with Emojis
- 🚀 **Starting operations**: "🚀 Initializing..."
- ✅ **Success**: "✅ Agent created successfully"
- ❌ **Errors**: "❌ Error: Port conflict detected"
- 📝 **Configuration**: "📝 Generating NATS configuration..."
- 🔐 **Certificates**: "🔐 Generating TLS certificates..."
- 🗑️ **Cleanup**: "🗑️ Removing all generated files..."
- 📋 **Listing**: "📋 Available agents:"
- 📊 **Information**: "📊 Agent Information:"
- ⚙️ **Processing**: "⚙️ Processing..."

### Color Coding (via chalk/logger)
- **Success**: Green text
- **Errors**: Red text
- **Warnings**: Yellow text
- **Info**: Cyan/blue text

## Error Handling Pattern

### Core Modules
Throw descriptive errors with context:
```typescript
if (conflict) {
  throw new Error(`Port ${port} is already in use by agent ${existingAgent}`);
}
```

### Commands
Catch and display user-friendly errors:
```typescript
try {
  await certificateAuthority.issueRootCA();
  console.log('✅ Root CA generated successfully');
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
```

### Adapters
Wrap infrastructure errors:
```typescript
try {
  execSync(command, { stdio: 'pipe' });
} catch (error) {
  throw new Error(`OpenSSL command failed: ${command}\n${error.message}`);
}
```

### Validation Errors
Use Zod for structured validation:
```typescript
const result = AgentNameSchema.safeParse(name);
if (!result.success) {
  throw new Error(`Invalid agent name: ${result.error.message}`);
}
```

## Certificate Generation

### OpenSSL via Adapter
- **Abstraction**: All OpenSSL calls through `OpenSSLAdapter`
- **No direct execSync**: Core never calls `child_process` directly
- **Command building**: Adapter constructs OpenSSL commands
- **Error handling**: Adapter wraps OpenSSL errors

### Certificate Parameters
- **Key size**: 4096-bit RSA
- **Signature**: SHA-256
- **Validity**: 825 days (server/agent), 10 years (Root CA)
- **Subject Alternative Names**: localhost, hostname, 127.0.0.1
- **Extended Key Usage**: serverAuth + clientAuth
- **Certificate chain**: Root CA → Server/Agent certificates

## Testing Conventions

### Test File Organization
- Mirror source structure: `tests/core/certificates/authority.test.ts`
- One test file per source file
- Group tests with `describe` blocks

### Test Naming
```typescript
describe('CertificateAuthority', () => {
  describe('issueRootCA', () => {
    it('should generate root CA certificate', async () => {
      // test
    });
    
    it('should throw error when OpenSSL fails', async () => {
      // test
    });
  });
});
```

### Test Structure
- **Arrange**: Setup mocks and data
- **Act**: Execute the function under test
- **Assert**: Verify results
- **Cleanup**: Use `afterEach` for cleanup

### Mocking Pattern
- Mock adapters, not core logic
- Use Vitest `vi.fn()` for mocks
- Verify mock calls with `expect().toHaveBeenCalledWith()`

## Documentation

### Code Comments
- **Minimal comments**: Code should be self-documenting
- **Why not what**: Explain non-obvious decisions, not obvious code
- **Complex logic**: Add brief explanation for complex algorithms
- **No obvious comments**: Don't state the obvious

### JSDoc
Use JSDoc for public APIs:
```typescript
/**
 * Issues a leaf node certificate signed by Root CA.
 * @param name - Agent name (must be valid AgentName)
 * @param outputDir - Directory for certificate files
 * @throws Error if Root CA doesn't exist or OpenSSL fails
 */
async issueLeafCert(name: AgentName, outputDir: string): Promise<void>
```

### README and Docs
- Keep documentation up to date with code
- Examples should be runnable
- Architecture decisions documented in PRD.md

## Import Organization

### Import Order
1. Node built-ins (`fs`, `path`)
2. External dependencies (`commander`, `zod`)
3. Internal core modules
4. Internal shared modules
5. Types

Example:
```typescript
import { execSync } from 'child_process';
import { z } from 'zod';
import { CertificateAuthority } from '../core/certificates/authority.js';
import { logger } from '../shared/logger.js';
import type { AgentInfo } from '../types/nats-config.js';
```

### Path Resolution
- Use relative imports for adjacent files
- Use absolute imports from project root where configured
- Always include `.js` extension in imports (ES modules requirement)

## Code Quality Standards

### Linting
- ESLint configured with TypeScript rules
- Run `yarn lint` before committing
- Fix issues with `yarn lint:fix`

### Formatting
- Prettier for consistent formatting
- Run `yarn format` before committing
- Check formatting with `yarn format:check`

### Type Safety
- No `any` types (use `unknown` if necessary)
- Explicit return types on public functions
- Strict null checks enforced
- Type guards where needed
