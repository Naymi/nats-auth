# PRD: NATS TLS Certificate and Configuration Management CLI

## Problem Statement

DevOps engineers and system administrators need to deploy NATS server clusters with TLS-based authentication between a main server and multiple leaf node agents. Manually generating certificates, managing certificate chains, and creating NATS server configurations is error-prone and time-consuming. A misconfigured certificate or incorrect configuration file can lead to authentication failures, security vulnerabilities, or cluster connectivity issues.

## Solution

A command-line tool that automates the generation of TLS certificates (Root CA, server certificates, agent certificates) and NATS server configurations. The tool provides an isolated directory structure for each agent, supports multiple agents with custom ports and hosts, and ensures proper certificate chain relationships. The architecture follows Clean Architecture principles with domain logic isolated from infrastructure concerns.

## User Stories

1. As a DevOps engineer, I want to initialize a complete NATS setup with one command, so that I can quickly provision a new environment
2. As a system administrator, I want to generate a Root CA certificate, so that I can establish a trust chain for all server and agent certificates
3. As a DevOps engineer, I want to generate a main NATS server certificate signed by the Root CA, so that clients can verify the server's identity
4. As a DevOps engineer, I want to generate a main NATS server configuration with absolute certificate paths, so that the server can start without manual configuration
5. As a system administrator, I want to create multiple agent instances with unique names, so that I can deploy leaf nodes across different hosts
6. As a DevOps engineer, I want to specify custom ports for each agent, so that I can run multiple agents on the same host without conflicts
7. As a DevOps engineer, I want to specify custom host bindings for each agent, so that I can control network interface access
8. As a system administrator, I want to list all agents with their certificate and configuration status, so that I can audit my deployment
9. As a DevOps engineer, I want to view detailed information about a specific agent, so that I can verify its configuration before deployment
10. As a system administrator, I want to edit an agent's configuration without regenerating certificates, so that I can adjust networking settings
11. As a DevOps engineer, I want each agent to have its own isolated directory, so that I can deploy agents independently without file conflicts
12. As a DevOps engineer, I want all certificates to use 4096-bit RSA keys and SHA-256 signing, so that I meet security compliance requirements
13. As a system administrator, I want certificates to include SAN (Subject Alternative Name) with localhost and IP addresses, so that connections work regardless of hostname resolution
14. As a DevOps engineer, I want the CLI to validate agent names, ports, and hosts before generating certificates, so that I catch configuration errors early
15. As a DevOps engineer, I want the CLI to check for port conflicts across agents, so that I don't create agents that cannot start
16. As a system administrator, I want to clean up all generated files with one command, so that I can reset my environment for testing
17. As a DevOps engineer, I want certificate generation failures to roll back partial changes, so that I don't end up with incomplete configurations
18. As a system administrator, I want clear, colored output with emojis indicating success or failure, so that I can quickly identify issues
19. As a DevOps engineer, I want the tool to verify OpenSSL is available before running commands, so that I get immediate feedback if dependencies are missing
20. As a DevOps engineer, I want JetStream enabled by default on both main server and agents, so that I have message persistence and streaming capabilities
21. As a system administrator, I want the Root CA to be valid for 10 years and server certificates for 825 days, so that I don't have frequent certificate rotation
22. As a DevOps engineer, I want all TLS connections to require mutual verification, so that both client and server authenticate each other
23. As a system administrator, I want to run the CLI during development with TypeScript directly, so that I can iterate quickly without building
24. As a DevOps engineer, I want to build the CLI to a distributable binary, so that I can deploy it to production environments
25. As a system administrator, I want to install the CLI globally, so that I can use it from any directory
26. As a DevOps engineer, I want detailed error messages when certificate generation fails, so that I can diagnose OpenSSL issues
27. As a system administrator, I want the CLI to use Commander.js conventions, so that I get consistent --help documentation across all commands
28. As a DevOps engineer, I want the main server to listen on port 4222 for client connections and port 7422 for leaf node connections, so that I follow NATS conventions
29. As a DevOps engineer, I want agents to listen on configurable ports (default 4223), so that I can customize my deployment topology
30. As a system administrator, I want each agent to have its own JetStream store directory, so that message streams are isolated
31. As a DevOps engineer, I want to start the main NATS server directly from the CLI with optional debug/trace logging, so that I don't need to remember nats-server command syntax
32. As a DevOps engineer, I want to start any agent directly from the CLI with optional debug/trace logging, so that I can quickly launch leaf nodes
33. As a system administrator, I want automatic port allocation when creating agents without specifying a port, so that I don't have to manually track port usage
34. As a DevOps engineer, I want the system to suggest the next available port when I encounter a port conflict, so that I can quickly resolve the issue
35. As a system administrator, I want interactive prompts when replacing existing agents, so that I don't accidentally overwrite configurations
36. As a DevOps engineer, I want the --replace flag to skip confirmation prompts, so that I can automate agent recreation in scripts
37. As a system administrator, I want the codebase to follow SOLID principles and Clean Architecture, so that it's easy to maintain and extend
38. As a developer, I want dependency injection to be used throughout, so that I can easily test and mock dependencies

## Implementation Decisions

### Architecture

The project follows **Clean Architecture** principles with clear separation of concerns:

- **Core Domain Layer** (`src/core/`): Pure business logic with no external dependencies
  - Agent management (registry, paths)
  - Certificate operations (authority, adapters)
  - Configuration building (builder, defaults)
  - Validation (schemas, validators)
  
- **Commands Layer** (`src/commands/`): Thin orchestration layer that coordinates core modules
  - Server commands (certificate generation, config generation, start)
  - Agent commands (create, edit, list, info, start)
  
- **Shared Layer** (`src/shared/`): Cross-cutting utilities
  - Filesystem operations
  - Logging utilities
  - Path constants
  
- **CLI Layer** (`src/cli.ts`): Commander.js-based user interface

### Module Structure

**Core Modules (~1200 LOC total):**

1. **CertificateAuthority** (certificates/authority.ts)
   - Consolidates all certificate generation logic
   - Methods: `issueRootCA()`, `issueServerCert()`, `issueLeafCert()`
   - Delegates to adapters for OpenSSL execution and filesystem operations
   - Handles SAN extension building and cleanup
   - Follows Single Responsibility Principle

2. **AgentRegistry** (agent/registry.ts)
   - Central registry for all agent lifecycle operations
   - Methods: `create()`, `get()`, `list()`, `update()`, `delete()`, `exists()`
   - Port conflict detection: `checkPortConflict()`, `findAvailablePort()`
   - Transaction support: `withTransaction()` for atomic operations
   - Configuration parsing and certificate info extraction
   - Uses dependency injection for all external dependencies

3. **NATSConfigBuilder** (config/builder.ts)
   - Generates NATS server and leaf node configurations
   - Methods: `serverConfig()`, `leafNodeConfig()`
   - Template-based config generation with type-safe options
   - Renders JetStream, TLS, and logging sections
   - Pure function approach - no side effects

4. **Validation** (validation/)
   - `schemas.ts`: Pure Zod schemas for input validation
   - `validators.ts`: Runtime validation functions and port availability checks
   - Schemas: AgentName, Port, Host, CreateAgentOptions, EditAgentOptions
   - Domain-driven validation rules

5. **Domain Models** (domain/)
   - `agent-name.ts`: AgentName value object with validation
   - Encapsulates business rules for agent naming
   - Immutable design

6. **Container** (container.ts)
   - Dependency injection container
   - Centralizes creation of core services
   - Simplifies testing by providing mockable dependencies

**Adapters:**

- **OpenSSLAdapter** (certificates/adapters/openssl.ts): Executes OpenSSL commands via execSync
- **FilesystemAdapter** (certificates/adapters/filesystem.ts): Handles file I/O for certificates

**Commands (~432 LOC total):**

Thin orchestration layer - commands only coordinate core modules and handle CLI output:
- Server commands: generate certificate/config, start server
- Agent commands: create, edit, list, info, start agent

**Shared Utilities (~103 LOC total):**

- `fs.ts`: Directory management (ensureDir, removeDir)
- `paths.ts`: Centralized path constants
- `logger.ts`: Colored console output with emojis

### Key Interfaces

```typescript
// Agent options
interface CreateAgentOptions {
  name: string;
  port?: number;
  host?: string;
  replace?: boolean;
}

interface EditAgentOptions {
  name: string;
  port?: number;
  host?: string;
  remoteUrl?: string;
}

// Configuration options
interface ServerConfigOptions {
  clientPort: number;
  leafNodePort: number;
  jetstream: JetStreamOptions;
  tls: TLSOptions;
  logging: LoggingOptions;
}

interface LeafNodeConfigOptions {
  port: number;
  host: string;
  jetstream: JetStreamOptions;
  remote: LeafNodeRemoteOptions;
  logging: LoggingOptions;
}
```

### Validation Rules

- **Agent names**: 1-64 characters, alphanumeric with hyphens/underscores, no leading/trailing hyphens
- **Ports**: Integer between 1 and 65535, checked for conflicts across existing agents
- **Hosts**: Valid hostname or IPv4 address format
- All validated using Zod schemas with descriptive error messages

### Certificate Generation

- Uses OpenSSL CLI via adapter pattern for testability
- Root CA: 4096-bit RSA, SHA-256, 10-year validity
- Server/Agent certs: 4096-bit RSA, SHA-256, 825-day validity
- All certificates include SAN with localhost, 127.0.0.1, and hostname
- Extended key usage: both server and client authentication

### Configuration Generation

- NATS configuration files use absolute paths to certificates (resolved at generation time)
- Main server: client port 4222, leaf node port 7422, JetStream enabled at ./jetstream
- Agents: configurable port (default 4223 or auto-allocated), configurable host (default 127.0.0.1), JetStream enabled at agents/<name>/jetstream
- All TLS connections require mutual verification (verify: true)

### Agent Isolation

- Each agent in separate directory: `agents/<agent-name>/`
- Structure: `certs/`, `config/`, `jetstream/` (runtime-created)
- Certificates: `<agent-name>.key`, `<agent-name>.crt`
- Configuration: `<agent-name>.conf`

### Transaction Mechanism

- Agent creation uses transactions for atomic operations through AgentRegistry
- Temporary directory created for certificate/config generation
- On success: files moved to target directory
- On failure: temporary directory cleaned up, target directory untouched
- Prevents partial agent creation from failed operations

### Server Lifecycle Management

- **server:start**: Launches main NATS server with optional --debug/--trace flags
- **agent:start <name>**: Launches specific agent with optional --debug/--trace flags
- Commands wrap nats-server with proper configuration file paths
- Logging flags passed through to nats-server

### Port Management

- **Automatic allocation**: If no port specified, finds next available port starting from 4223
- **Conflict detection**: Checks all existing agents before creating new one
- **Interactive resolution**: Suggests next available port when conflict detected
- **Validation**: All port assignments validated before certificate generation

### Error Handling

- OpenSSL availability checked before operations
- Descriptive error messages with operation context
- Port conflicts detected before certificate generation
- Process exits with status code 1 on critical errors
- Console output uses colored text and emojis for clarity

### Commands

- `init`: Full setup (Root CA + main server + default agent)
- `server:init`: Generate Root CA and main server
- `server:start [--debug] [--trace]`: Start main NATS server
- `agent:init`: Generate default agent (requires Root CA)
- `agent:create <name> [--port] [--host] [--replace]`: Create new agent with options
- `agent:list`: List all agents with status
- `agent:info <name>`: Show detailed agent information
- `agent:edit <name> [--port] [--host] [--remote-url]`: Edit agent configuration
- `agent:start <name> [--debug] [--trace]`: Start specific agent
- `clean` (alias: `clear`): Remove all generated files

## Testing Decisions

### What Makes a Good Test

- Tests verify external behavior, not implementation details
- Tests do not depend on actual OpenSSL installation (use mocks for OpenSSL adapter)
- Tests use temporary directories for filesystem operations
- Tests clean up after themselves (beforeEach/afterEach hooks)
- Tests verify that modules return correct data structures and enforce business rules

### Testing Seams

The architecture provides natural testing seams at adapter boundaries:

1. **Highest seam - Core modules** (CertificateAuthority, AgentRegistry, NATSConfigBuilder):
   - Test with mocked adapters (OpenSSL, Filesystem)
   - Verify business logic without external dependencies
   - Test transaction rollback, port conflict detection, config generation

2. **Adapter seam** (OpenSSLAdapter, FilesystemAdapter):
   - Test with mocked child_process and fs modules
   - Verify command construction and error handling
   - Test file I/O operations

3. **Integration seam** (Commands):
   - Test end-to-end with real filesystem in temporary directories
   - Mock only OpenSSL calls
   - Verify CLI output and error messages

### Modules to Test

1. **Core layer** (highest priority):
   - `CertificateAuthority`: Certificate generation logic, SAN building, cleanup
   - `AgentRegistry`: Agent lifecycle, port conflicts, transactions, config parsing
   - `NATSConfigBuilder`: Template generation, option handling
   - `Validation`: Zod schema validation for all input types

2. **Adapter layer**:
   - `OpenSSLAdapter`: Command execution and error handling (mocked child_process)
   - `FilesystemAdapter`: File operations (mocked fs module)

3. **Shared layer**:
   - `fs.ts`: Directory creation and removal with real filesystem
   - `paths.ts`: Path resolution logic

4. **Commands layer** (integration tests):
   - Test commands via child_process spawning the CLI
   - Verify exit codes and stdout/stderr output
   - Test error scenarios (missing dependencies, invalid arguments)

### Prior Art

The project uses Vitest with describe/it structure. Existing patterns:
- Temporary directories with mkdtemp/rm
- Mocking external dependencies (child_process, fs)
- Testing both success and error paths
- Validation tests with valid and invalid inputs

### Testing Strategy

- **Unit tests**: Test core modules in isolation with mocked adapters
- **Integration tests**: Test commands end-to-end with real filesystem
- **No mocks for filesystem in integration tests**: Use real temporary directories
- **Mock OpenSSL**: Avoid dependency on system OpenSSL installation
- **Test transaction rollback**: Verify partial changes are cleaned up on failure
- **Test port conflict resolution**: Verify automatic port allocation and conflict detection

## Out of Scope

- Certificate rotation and renewal (future feature)
- Automatic certificate expiration monitoring
- Web UI or GUI for certificate management
- Integration with certificate management systems (Vault, cert-manager)
- Support for certificate authorities other than self-signed Root CA
- Automated deployment to remote hosts
- Health checks or monitoring of NATS servers
- Configuration validation against running NATS servers
- Support for other authentication methods (JWT, username/password)
- Multi-region or geo-distributed certificate management
- Certificate revocation lists (CRL) or OCSP
- Integration with cloud provider secret management (AWS Secrets Manager, Azure Key Vault)
- Backup and restore of certificate/configuration state
- Migration tools for existing NATS deployments
- Docker or Kubernetes integration
- Graceful server shutdown and process management
- Log aggregation or forwarding

## Further Notes

### Technical Constraints

- The tool assumes OpenSSL is installed and available in PATH - this is a hard dependency
- All generated files (certs/, config/, agents/) are gitignored to prevent accidental commits
- Certificate paths in NATS configuration files are absolute, resolved at generation time, making configs non-portable across systems
- The CLI uses ES modules throughout (import/export), requiring Node.js with ES module support
- JetStream directories are created by NATS server at runtime, not by the CLI

### Design Decisions

- **Clean Architecture**: Core business logic isolated from infrastructure concerns
- **Adapter pattern**: OpenSSL and filesystem operations abstracted behind interfaces
- **Single Responsibility**: Each module has one clear purpose (certificate generation, agent registry, config building)
- **Dependency Injection**: Adapters injected into core classes for testability
- **Transaction pattern**: Atomic agent operations with automatic rollback
- **Builder pattern**: NATSConfigBuilder constructs complex configurations step by step

### Behavioral Notes

- The default agent (created by `agent:init` or `init`) is always named "agent" and lives in `agents/agent/`
- Port conflict detection only checks other agents managed by this tool, not system-wide port usage
- The tool does not validate whether NATS server configurations are syntactically correct - this is caught at runtime by NATS server
- When no port is specified for agent creation, the system automatically finds the next available port starting from 4223
- Interactive prompts appear when attempting to replace an existing agent (unless --replace flag is used)
- Server start commands launch nats-server as a foreground process - no daemon mode

### Recent Refactoring

The project underwent a major refactoring (completed 2026-06-29) to Clean Architecture with SOLID principles:

1. **Phase 1**: Created AgentRegistry to consolidate agent management logic
2. **Phase 2**: Created CertificateAuthority to consolidate certificate generation with adapter pattern
3. **Phase 3**: Created NATSConfigBuilder to consolidate configuration generation
4. **Phase 4**: Separated pure Zod schemas from runtime validation checks
5. **Phase 5-9**: Applied SOLID principles throughout the codebase:
   - Created domain value objects (AgentName)
   - Introduced dependency injection container
   - Split large modules following Single Responsibility Principle
   - Established clear interfaces for adapters (OpenSSL, Filesystem)
   - Implemented proper separation of concerns across all layers

This refactoring reduced code duplication by ~40%, improved testability through adapter patterns, and established clear boundaries between domain logic and infrastructure concerns. The architecture now follows industry best practices for maintainability and extensibility.
