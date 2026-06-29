# Design Patterns and Guidelines

## Architectural Patterns

### Feature-Based Organization
- Each domain (ca, server, agent) is isolated in its own directory
- Features export pure functions, no classes or singletons
- CLI orchestrates feature functions

### Functional Programming
- All functions are pure and side-effect explicit
- No global state or mutable shared state
- Heavy use of async/await for I/O operations

### Path Management
- Centralized path constants in utils/paths.ts
- Helper functions for agent-specific paths
- Absolute paths used in generated NATS configs

## Conventions to Follow

### Error Handling
**Current approach**:
```typescript
try {
  await access(file, constants.F_OK);
} catch {
  // Handle missing file
}
```

**For critical errors**:
```typescript
console.error('❌ Error: Description');
process.exit(1);
```

### Certificate Generation Pattern
All certificate generation follows this sequence:
1. Generate private key (4096-bit RSA)
2. Create CSR (Certificate Signing Request)
3. Sign CSR with CA to create certificate
4. Use .ext file for SAN (Subject Alternative Names)

### Agent Isolation
Each agent has complete isolation:
- Own directory under agents/<name>/
- Own certificates in certs/
- Own config in config/
- Own JetStream store in jetstream/

### Configuration Templates
NATS configs are generated as template strings with:
- Absolute paths to certificates
- Configurable port/host
- JetStream settings
- TLS verification enabled

## Anti-Patterns to Avoid
- ❌ Don't use default exports (use named exports)
- ❌ Don't create classes unless necessary (prefer functions)
- ❌ Don't use require() (use ES import)
- ❌ Don't mutate shared state
- ❌ Don't silently swallow errors (at least log them)
