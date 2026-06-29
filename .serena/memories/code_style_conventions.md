# Code Style and Conventions

## TypeScript Configuration
- **Strict mode**: Enabled (all strict checks on)
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **ES Modules**: All files use import/export (no require)
- **Types**: @types/node included

## Naming Conventions
- **Files**: kebab-case (generate-root-ca.ts, edit-agent.ts)
- **Functions**: camelCase (generateRootCA, createAgent)
- **Constants**: UPPER_SNAKE_CASE (CERTS_DIR, CONFIG_DIR)
- **Interfaces**: PascalCase (AgentInfo, CreateAgentOptions)

## Code Organization
- **One responsibility per function**: Each function does one thing
- **Functional approach**: Pure functions, no global state
- **Async/await**: Used consistently for async operations
- **Export pattern**: Named exports only (no default exports)

## User-Facing Output
- **Console messages**: Use emojis for visual feedback
  - 🚀 Starting operations
  - ✅ Success
  - ❌ Errors
  - 📝 Configuration generation
  - 🔐 Certificate generation
  - 🗑️ Cleanup
  - 📋 Listing
  - 📊 Information display

## Error Handling Pattern
- Use try-catch for file operations
- Log errors with ❌ emoji
- Call process.exit(1) on critical errors
- **Current limitation**: OpenSSL errors not caught (uses stdio: 'inherit')

## Certificate Generation
- **OpenSSL via execSync**: All certificate operations use openssl CLI
- **Key size**: 4096-bit RSA
- **Signature**: SHA-256
- **Validity**: 825 days (server/agent), 10 years (Root CA)
- **Subject Alternative Names**: localhost, hostname, 127.0.0.1
- **Extended Key Usage**: serverAuth + clientAuth
