# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NATS server setup demonstrating TLS-based authentication between a main server and leaf node agents. The project uses TypeScript scripts to generate TLS certificates (Root CA, server, and leaf node certificates) and NATS server configurations.

## Architecture

- **Main Server**: Acts as the central NATS hub with TLS-enabled client connections (port 4222) and leaf node connections (port 7422). Includes JetStream for persistence and streaming.
- **Agent (Leaf Node)**: Connects to the main server via TLS with client certificate authentication (port 4223). Has its own JetStream store.
- **Certificate Chain**: Root CA signs both the main server certificate and leaf node certificate, establishing mutual trust
- **JetStream**: Both main server and agent have JetStream enabled with separate store directories (./jetstream and ./jetstream-agent)

## Commands

The project includes a CLI tool built with Commander.js that provides commands for certificate and configuration management.

### CLI Usage

```bash
yarn cli [command]      # Run CLI commands during development
yarn cli --help         # Show all available commands

# Or use the built CLI directly
node dist/cli.js [command]
nats-auth [command]     # If installed globally
```

### Setup (First Time)
```bash
yarn cli init           # Development
# or
node dist/cli.js init   # From build
```

This generates everything in one command:
- Root CA (certificate authority)
- Main server certificate and configuration
- Default agent in agents/agent/ directory

### Certificate Generation (Individual)
```bash
yarn cli server:init    # Generate Root CA and main server
yarn cli agent:init     # Generate default agent (requires server:init first)
```

**Important**: `agent:init` will fail if Root CA doesn't exist. Always run `server:init` before `agent:init`.

### Agent Management
```bash
# List all agents
yarn cli agent:list
# or
node dist/cli.js agent:list

# Create a new agent with custom port and host
yarn cli agent:create <name> [--port <port>] [--host <host>] [--replace]
# Example:
yarn cli agent:create worker-1 --port 4224 --host 0.0.0.0

# If agent exists, you'll be prompted to replace it
# Use --replace flag to skip the prompt and force replacement
yarn cli agent:create worker-1 --replace

# Get detailed information about an agent
yarn cli agent:info <name>

# Edit agent configuration
yarn cli agent:edit <name> [--port <port>] [--host <host>] [--remote-url <url>]
# Example:
yarn cli agent:edit worker-1 --port 5000

# Start an agent
yarn cli agent:start <name> [--debug] [--trace]
# or
node dist/cli.js agent:start <name>
# Example:
yarn cli agent:start agent
yarn cli agent:start worker-1 --debug
```

**Agent Management Features:**
- **agent:list** - Shows all agents with certificate and config status
- **agent:create** - Generates certificate and config for a new agent in isolated directory. If agent exists, prompts for confirmation to replace (use --replace to skip prompt)
- **agent:info** - Displays detailed information including certificate validity, port, host, and paths
- **agent:edit** - Updates agent configuration (port, host, remote URL) without regenerating certificates
- **agent:start** - Starts an agent using nats-server with optional debug/trace logging

### Cleanup
```bash
yarn cli clean
# or
node dist/cli.js clean
```

This removes `certs/`, `config/`, and `agents/` directories.

### Running Servers

**Using CLI (recommended):**
```bash
# Start main server
yarn cli server:start
# or
node dist/cli.js server:start

# Start an agent
yarn cli agent:start <name>
# or
node dist/cli.js agent:start <name>

# With debug logging
yarn cli server:start --debug
yarn cli agent:start <name> --debug

# With trace logging
yarn cli server:start --trace
yarn cli agent:start <name> --trace
```

**Using nats-server directly:**
```bash
# Main server
nats-server -c config/main.conf

# Default agent
nats-server -c agents/agent/config/agent.conf

# Custom agents
nats-server -c agents/<agent-name>/config/<agent-name>.conf
```

## Project Structure

```
src/
  cli.ts                    # Main CLI entry point
  
  core/                     # Core domain logic
    certificates/           # Certificate management
      authority.ts          # CertificateAuthority class
      adapters/
        openssl.ts          # OpenSSL adapter
        filesystem.ts       # Filesystem adapter
    config/                 # NATS configuration
      builder.ts            # NATSConfigBuilder class
      defaults.ts           # Default configuration constants
    agent/                  # Agent registry and management
      registry.ts           # AgentRegistry class
      paths.ts              # Agent path helpers
    validation/             # Validation logic
      schemas.ts            # Zod schemas
      validators.ts         # Validation functions
  
  commands/                 # CLI command implementations
    server/
      generate-certificate.ts  # Server certificate generation
      generate-config.ts       # Server NATS configuration
      start.ts                 # Start main server
    agent/
      create.ts             # Create new agent
      edit.ts               # Edit agent configuration
      generate-certificate.ts  # Agent certificate generation
      generate-config.ts       # Agent NATS configuration
      info.ts               # Get agent details
      list.ts               # List all agents
      start.ts              # Start agent
  
  shared/                   # Shared utilities
    fs.ts                   # File system helpers
    logger.ts               # Logging utilities
    paths.ts                # Global path constants
  
  types/                    # Global type definitions
    nats-config.ts          # NATS configuration interfaces

tests/                      # Test files
  core/
    certificates/
    config/
    agent/
  shared/

certs/                      # Generated TLS certificates (gitignored)
  rootCA.key/crt            # Root Certificate Authority
  main.key/crt              # Main server certificate
config/                     # Generated NATS configurations (gitignored)
  main.conf                 # Main server config with absolute cert paths
agents/                     # Agent directories (gitignored)
  <agent-name>/             # Individual agent directory
    certs/                  # Agent certificates
      <agent-name>.key/crt  # Agent certificate and key
    config/                 # Agent configuration
      <agent-name>.conf     # Agent NATS config
    jetstream/              # Agent JetStream data (created at runtime)
jetstream/                  # JetStream data for main server (gitignored)
```

### CLI Implementation

The CLI tool (`src/cli.ts`) uses Commander.js and orchestrates feature modules:
- **init** - Full setup (Root CA + main server + default agent)
- **server:init** - Generate Root CA and main server components
- **server:start** - Start the main NATS server
- **agent:init** - Generate default agent in agents/agent/ directory
- **clean** (alias: clear) - Remove all generated files (certs, config, agents)
- **agent:list** - List all agents with status
- **agent:create** - Create new agent with custom name and options in separate directory
- **agent:info** - Show detailed agent information
- **agent:edit** - Edit agent configuration
- **agent:start** - Start an agent using nats-server

Core modules are organized in `src/core/`:
- **certificates/** - Certificate Authority and adapters (OpenSSL, filesystem)
- **config/** - NATS configuration builder and defaults
- **agent/** - Agent registry and path management
- **validation/** - Zod schemas and validators

Command handlers in `src/commands/` are thin wrappers that:
- Parse CLI arguments
- Call core modules
- Display results to the user

Shared utilities in `src/shared/`:
- **fs.ts** - Directory management (create, remove)
- **paths.ts** - Centralized path constants
- **logger.ts** - Logging utilities

All commands include proper error handling, colored output with emojis, and helpful messages.

## Certificate Details

All certificates use:
- 4096-bit RSA keys
- SHA-256 signing
- SAN (Subject Alternative Name) with localhost, IP 127.0.0.1, and hostname
- Extended key usage for both server and client authentication
- Main server cert valid for 825 days
- Root CA valid for 10 years

## Development Notes

- CLI built with Commander.js for command management and help generation
- Certificate generation uses `openssl` CLI via `execSync` to create certificates
- Configuration files use absolute paths to certificates (resolved at generation time)
- All TLS connections require mutual verification (verify: true)
- The leaf node authenticates to the main server using its client certificate signed by the shared Root CA
- ES modules used throughout (import/export syntax)
- Used yarn package manager
- Used Promise API and async/await