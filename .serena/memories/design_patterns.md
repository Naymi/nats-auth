# Design Patterns and Guidelines

**Last Updated**: 2026-06-30
**Architecture**: Clean Architecture with SOLID principles

## Architectural Patterns

### Clean Architecture
- **Core Layer** (`src/core/`): Pure business logic with zero infrastructure dependencies
- **Commands Layer** (`src/commands/`): Thin orchestration layer coordinating core modules
- **Shared Layer** (`src/shared/`): Cross-cutting utilities
- **Dependency flow**: Commands → Core ← Adapters (core depends on abstractions, not implementations)

### SOLID Principles

#### Single Responsibility Principle (SRP)
Each class has one reason to change:
- `CertificateAuthority`: Only certificate generation logic
- `AgentRegistry`: Only agent lifecycle management
- `NATSConfigBuilder`: Only configuration building
- `OpenSSLAdapter`: Only OpenSSL command execution
- `FilesystemAdapter`: Only certificate file I/O

#### Open/Closed Principle (OCP)
Classes open for extension, closed for modification:
- Core classes accept adapters via dependency injection
- New adapters can be added without changing core logic
- Example: Could add `VaultFilesystemAdapter` without touching `CertificateAuthority`

#### Liskov Substitution Principle (LSP)
Implementations honor interface contracts:
- `OpenSSLAdapter` fulfills the OpenSSL interface contract
- `FilesystemAdapter` fulfills the filesystem interface contract
- Mocks can replace real adapters in tests

#### Interface Segregation Principle (ISP)
Small, focused interfaces:
- Adapters define minimal required methods
- No client forced to depend on methods it doesn't use

#### Dependency Inversion Principle (DIP)
Core depends on abstractions, not concrete implementations:
- `CertificateAuthority` depends on adapter interfaces, not `child_process` or `fs`
- Container provides concrete implementations at runtime
- Tests provide mocked implementations

### Adapter Pattern
External dependencies abstracted behind interfaces:
- **OpenSSLAdapter**: Wraps `child_process.execSync` for OpenSSL commands
- **FilesystemAdapter**: Wraps `fs` operations for certificate files
- Benefits: Testability (mock adapters), flexibility (swap implementations)

### Value Objects
Domain concepts encapsulated in immutable classes:
- **AgentName**: Encapsulates agent naming rules, validation logic
- Prevents invalid states at compile time
- Makes domain rules explicit

### Transaction Pattern
Atomic operations with automatic rollback:
- `AgentRegistry.create()` uses temporary directory for certificate generation
- On success: files moved to target directory
- On failure: temporary directory cleaned up, target untouched
- Prevents partial agent creation

### Builder Pattern
Complex object construction:
- **NATSConfigBuilder**: Step-by-step configuration building
- Type-safe options
- Template-based rendering

### Dependency Injection
Container-based DI for testability:
- `Container` creates and wires all core services
- Adapters injected via constructor
- Commands receive fully-wired services

## Conventions to Follow

### Error Handling

**Core modules** throw descriptive errors:
```typescript
throw new Error(`Port ${port} is already in use by agent ${existingAgent}`);
```

**Commands** catch and display user-friendly errors:
```typescript
try {
  await registry.create(options);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
```

**Adapters** wrap infrastructure errors:
```typescript
try {
  execSync(command);
} catch (error) {
  throw new Error(`OpenSSL command failed: ${command}`);
}
```

### Certificate Generation Pattern
All certificate generation via `CertificateAuthority`:
1. Generate private key (4096-bit RSA)
2. Create CSR (Certificate Signing Request)
3. Sign CSR with CA to create certificate
4. Use .ext file for SAN (Subject Alternative Names)
5. Cleanup temporary files

### Agent Isolation
Each agent has complete isolation:
- Own directory under `agents/<name>/`
- Own certificates in `certs/`
- Own config in `config/`
- Own JetStream store in `jetstream/` (runtime-created)

### Configuration Templates
NATS configs generated via `NATSConfigBuilder`:
- Absolute paths to certificates
- Configurable port/host
- JetStream settings
- TLS verification enabled
- Template strings with type-safe options

### Validation Pattern
Input validation at boundaries:
- Zod schemas in `core/validation/schemas.ts` (pure schemas)
- Runtime validators in `core/validation/validators.ts` (port availability, etc.)
- Commands validate before calling core
- Core assumes validated input (fail fast on violations)

### Testing Pattern
- **Unit tests**: Core modules with mocked adapters
- **Integration tests**: Commands with real filesystem, mocked OpenSSL
- **No mocks for domain logic**: Only mock infrastructure (OpenSSL, filesystem)
- Use temporary directories for filesystem tests

## Anti-Patterns to Avoid

### Code Organization
- ❌ Don't bypass adapters and call infrastructure directly from core
- ❌ Don't put business logic in commands (keep them thin)
- ❌ Don't create circular dependencies (core should never import from commands)
- ❌ Don't use default exports (use named exports for better refactoring)

### Architecture Violations
- ❌ Don't import infrastructure libraries (`fs`, `child_process`) in core modules
- ❌ Don't skip dependency injection and create adapters inside core classes
- ❌ Don't duplicate business logic across commands (consolidate in core)
- ❌ Don't mix validation logic with business logic (separate concerns)

### Error Handling
- ❌ Don't silently swallow errors (at least log them)
- ❌ Don't throw generic errors without context
- ❌ Don't catch errors just to re-throw without adding value

### Testing
- ❌ Don't test implementation details (test public interfaces)
- ❌ Don't mock what you don't own (use adapters)
- ❌ Don't skip cleanup in tests (use beforeEach/afterEach)
- ❌ Don't test with production OpenSSL (mock the adapter)

### Code Quality
- ❌ Don't use `any` type (use proper types or `unknown`)
- ❌ Don't mutate shared state (use immutable patterns)
- ❌ Don't use `require()` (use ES import)
- ❌ Don't create god classes (follow Single Responsibility)
