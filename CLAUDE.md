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
yarn cli [command]      # Run CLI commands
yarn cli --help         # Show all available commands
```

### Setup (First Time)
```bash
yarn setup              # Generate all certificates and configurations
# or
yarn cli setup
```

This generates everything in one command:
- Root CA (certificate authority)
- Main server certificate and configuration
- Leaf node certificate and agent configuration

### Certificate Generation (Individual)
```bash
yarn gen:main           # Generate Root CA and main server certificate/config
yarn gen:agent          # Generate leaf node certificate/config (run gen:main first)
# or use CLI directly
yarn cli gen:main
yarn cli gen:agent
```

**Important**: `gen:agent` will fail if Root CA doesn't exist. Always run `gen:main` before `gen:agent`.

### Cleanup
```bash
yarn clean              # Remove all generated certificates and configurations
# or
yarn cli clean
```

This removes both `certs/` and `config/` directories.

### Running Servers
```bash
yarn start:main         # Start main NATS server on ports 4222 (client) and 7422 (leafnode)
yarn start:agent        # Start agent leaf node on port 4223
```

Or use nats-server directly:
```bash
nats-server -c config/main.conf
nats-server -c config/agent.conf
```

## Project Structure

```
src/
  cli.ts                    # Main CLI entry point
  features/
    ca/
      generate-root-ca.ts   # Root CA generation
    server/
      generate-certificate.ts  # Main server certificate generation
      generate-config.ts       # Main server NATS configuration
    agent/
      generate-certificate.ts  # Leaf node certificate generation
      generate-config.ts       # Agent NATS configuration
  utils/
    fs.ts                   # File system utilities (ensureDir, removeDir)
    paths.ts                # Path constants (CERTS_DIR, CONFIG_DIR)
certs/                      # Generated TLS certificates (gitignored)
  rootCA.key/crt            # Root Certificate Authority
  main.key/crt              # Main server certificate
  leaf.key/crt              # Leaf node certificate
config/                     # Generated NATS configurations (gitignored)
  main.conf                 # Main server config with absolute cert paths
  agent.conf                # Leaf node config with absolute cert paths
jetstream/                  # JetStream data for main server (gitignored)
jetstream-agent/            # JetStream data for agent (gitignored)
scripts/                    # Legacy scripts (deprecated)
  generate-main.ts
  generate-agent.ts
  cli.ts
```

### CLI Implementation

The CLI tool (`src/cli.ts`) uses Commander.js and orchestrates feature modules:
- **setup** - Full setup (Root CA + main server + agent)
- **gen:main** - Generate Root CA and main server components
- **gen:agent** - Generate leaf node components
- **clean** - Remove all generated files

Each feature is isolated in its own directory under `src/features/`:
- **ca/** - Root Certificate Authority generation
- **server/** - Main server certificate and configuration
- **agent/** - Leaf node certificate and configuration

Shared utilities are in `src/utils/`:
- **fs.ts** - Directory management (create, remove)
- **paths.ts** - Centralized path constants

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