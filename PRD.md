# PRD: NATS TLS Certificate and Configuration Management CLI

## Problem Statement

DevOps engineers and system administrators need to deploy NATS server clusters with TLS-based authentication between a main server and multiple leaf node agents. Manually generating certificates, managing certificate chains, and creating NATS server configurations is error-prone and time-consuming. A misconfigured certificate or incorrect configuration file can lead to authentication failures, security vulnerabilities, or cluster connectivity issues.

## Solution

A command-line tool that automates the generation of TLS certificates (Root CA, server certificates, agent certificates) and NATS server configurations. The tool provides an isolated directory structure for each agent, supports multiple agents with custom ports and hosts, and ensures proper certificate chain relationships. All operations are atomic through transaction-based rollback on failure.

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

## Implementation Decisions

### Module Structure
- **CLI Module (cli.ts)**: Commander.js-based CLI that orchestrates all commands and handles user interaction
- **CA Module (features/ca/)**: Root Certificate Authority generation with 10-year validity
- **Server Module (features/server/)**: Main NATS server certificate and configuration generation
- **Agent Module (features/agent/)**: Agent certificate, configuration, and lifecycle management (create, list, info, edit)
- **Validation Module (utils/validation.ts)**: Zod schemas for input validation (agent names, ports, hosts, options)
- **Transaction Module (utils/transaction.ts)**: AgentTransaction class for atomic file operations with rollback
- **OpenSSL Module (utils/openssl.ts)**: Wrapper for OpenSSL CLI commands with error handling
- **Filesystem Module (utils/fs.ts)**: Directory management utilities (ensureDir, removeDir)
- **Paths Module (utils/paths.ts)**: Centralized path constants and agent-specific path helpers

### Interfaces
- **CreateAgentOptions**: `{ name: string, port?: number, host?: string }` - Options for creating a new agent
- **EditAgentOptions**: `{ name: string, port?: number, host?: string, remoteUrl?: string }` - Options for editing agent configuration
- **AgentTransaction**: Class with `begin()`, `commit()`, `rollback()`, `cleanup()` methods for atomic operations

### Validation Rules
- **Agent names**: 1-64 characters, alphanumeric with hyphens/underscores, no leading/trailing hyphens
- **Ports**: Integer between 1 and 65535, checked for conflicts across existing agents
- **Hosts**: Valid hostname or IPv4 address format
- All validated using Zod schemas with descriptive error messages

### Certificate Generation
- Uses OpenSSL CLI via `execSync` for certificate operations
- Root CA: 4096-bit RSA, SHA-256, 10-year validity
- Server/Agent certs: 4096-bit RSA, SHA-256, 825-day validity
- All certificates include SAN with localhost, 127.0.0.1, and hostname
- Extended key usage: both server and client authentication

### Configuration Generation
- NATS configuration files use absolute paths to certificates (resolved at generation time)
- Main server: client port 4222, leaf node port 7422, JetStream enabled at ./jetstream
- Agents: configurable port (default 4223), configurable host (default 127.0.0.1), JetStream enabled at ./jetstream-agent
- All TLS connections require mutual verification (verify: true)

### Agent Isolation
- Each agent in separate directory: `agents/<agent-name>/`
- Structure: `certs/`, `config/`, `jetstream/` (runtime-created)
- Certificates: `<agent-name>.key`, `<agent-name>.crt`
- Configuration: `<agent-name>.conf`

### Transaction Mechanism
- Agent creation uses transactions for atomic operations
- Temporary directory created for certificate/config generation
- On success: files moved to target directory
- On failure: temporary directory cleaned up, target directory untouched
- Prevents partial agent creation from failed operations

### Error Handling
- OpenSSL availability checked before operations
- Descriptive error messages with operation context
- Port conflicts detected before certificate generation
- Process exits with status code 1 on critical errors
- Console output uses colored text and emojis for clarity

### Commands
- `init`: Full setup (Root CA + main server + default agent)
- `server:init`: Generate Root CA and main server
- `agent:init`: Generate default agent (requires Root CA)
- `agent:create <name> [--port] [--host]`: Create new agent with options
- `agent:list`: List all agents with status
- `agent:info <name>`: Show detailed agent information
- `agent:edit <name> [--port] [--host] [--remote-url]`: Edit agent configuration
- `clean` (alias: `clear`): Remove all generated files

## Testing Decisions

### What Makes a Good Test
- Tests verify external behavior, not implementation details
- Tests do not depend on actual OpenSSL installation (use mocks for OpenSSL calls)
- Tests use temporary directories for filesystem operations
- Tests clean up after themselves (beforeEach/afterEach hooks)
- Tests verify that functions return correct data structures, not that they call specific internal functions

### Modules to Test
1. **Utils layer** (highest priority - already partially complete):
   - `utils/fs.ts`: Directory creation and removal with real filesystem
   - `utils/openssl.ts`: OpenSSL command execution and error handling (mocked child_process)
   - `utils/validation.ts`: Zod schema validation for all input types
   - `utils/transaction.ts`: Transaction rollback and commit behavior

2. **Feature layer**:
   - `features/agent/create-agent.ts`: Agent creation with transaction rollback on failure
   - `features/agent/edit-agent.ts`: Configuration editing without certificate regeneration
   - `features/agent/list-agents.ts`: Agent discovery and status reporting
   - `features/agent/get-agent-info.ts`: Information retrieval and formatting

3. **CLI layer** (integration tests):
   - Command execution via child_process spawning the CLI
   - Verify exit codes and stdout/stderr output
   - Test error scenarios (missing dependencies, invalid arguments)

### Prior Art
- **fs.test.ts**: Uses temporary directories with mkdtemp/rm, tests both success and error paths
- **openssl.test.ts**: Mocks child_process.execSync, verifies error message formatting
- **validation.test.ts**: Tests Zod schema validation with valid and invalid inputs
- All tests use Vitest with describe/it structure

### Testing Strategy
- **Unit tests**: Test individual functions in isolation (utilities and feature modules)
- **Integration tests**: Test CLI commands end-to-end with real filesystem operations
- **No mocks for filesystem**: Use real temporary directories to catch filesystem-related bugs
- **Mock OpenSSL**: Avoid dependency on system OpenSSL installation for CI/CD
- **Test transaction rollback**: Verify partial changes are cleaned up on failure

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

## Further Notes

- The tool assumes OpenSSL is installed and available in PATH - this is a hard dependency
- All generated files (certs/, config/, agents/) are gitignored to prevent accidental commits
- The transaction mechanism only protects agent creation - Root CA and server generation do not use transactions yet
- Certificate paths in NATS configuration files are absolute, resolved at generation time, making configs non-portable across systems
- The CLI uses ES modules throughout (import/export), requiring Node.js with ES module support
- JetStream directories are created by NATS server at runtime, not by the CLI
- The default agent (created by `agent:init` or `init`) is always named "agent" and lives in `agents/agent/`
- Port conflict detection only checks other agents managed by this tool, not system-wide port usage
- The tool does not validate whether NATS server configurations are syntactically correct - this is caught at runtime by NATS server
