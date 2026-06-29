# Suggested Commands

**Last Updated**: 2026-06-30

## Development Commands

### Build & Run
```bash
yarn install            # Install dependencies (first time)
yarn build              # Compile TypeScript to dist/
yarn build:clean        # Clean dist/ and rebuild
yarn cli [command]      # Run CLI in development mode (via tsx)
```

### Testing
```bash
yarn test               # Run tests in watch mode
yarn test:run           # Run tests once
yarn test:ui            # Run tests with UI
yarn test:coverage      # Run tests with coverage report
```

### Linting & Formatting
```bash
yarn lint               # Check for linting errors
yarn lint:fix           # Fix linting errors automatically
yarn format             # Format code with Prettier
yarn format:check       # Check formatting without modifying
```

## CLI Commands (Development)

### Initialization
```bash
# Full setup (Root CA + main server + default agent)
yarn cli init

# Main server only (Root CA + server cert + config)
yarn cli server:init

# Default agent only (requires server:init first)
yarn cli agent:init
```

### Agent Management
```bash
# List all agents
yarn cli agent:list

# Create new agent with options
yarn cli agent:create <name>                    # Auto-assign port
yarn cli agent:create <name> --port 4224        # Custom port
yarn cli agent:create <name> --host 0.0.0.0     # Custom host
yarn cli agent:create <name> --replace          # Replace without prompt

# Get agent details
yarn cli agent:info <name>

# Edit agent configuration (no cert regeneration)
yarn cli agent:edit <name> --port 5000
yarn cli agent:edit <name> --host 127.0.0.1
yarn cli agent:edit <name> --remote-url tls://prod-server:7422
```

### Server Management
```bash
# Start main server
yarn cli server:start
yarn cli server:start --debug       # With debug logging
yarn cli server:start --trace       # With trace logging (verbose)

# Start agent
yarn cli agent:start <name>
yarn cli agent:start <name> --debug
yarn cli agent:start <name> --trace
```

### Cleanup
```bash
# Remove all generated files (certs/, config/, agents/)
yarn cli clean
```

### Help
```bash
yarn cli --help                     # Show all commands
yarn cli agent:create --help        # Help for specific command
yarn cli server:start --help
```

## Production CLI (After build)

```bash
# Using built CLI
node dist/cli.js [command]

# If installed globally
nats-auth [command]
```

## Running NATS Servers Directly

**Recommended**: Use CLI commands (`yarn cli server:start`, `yarn cli agent:start`)

**Alternative** (direct nats-server):
```bash
# Main server
nats-server -c config/main.conf
nats-server -c config/main.conf -D      # With debug logs
nats-server -c config/main.conf -DV     # With trace logs

# Default agent
nats-server -c agents/agent/config/agent.conf

# Custom agent
nats-server -c agents/<agent-name>/config/<agent-name>.conf
```

## Typical Workflows

### First Time Setup
```bash
yarn install
yarn build
yarn cli init
```

### Create and Test Multiple Agents
```bash
yarn cli init
yarn cli agent:create worker-1 --port 4224
yarn cli agent:create worker-2 --port 4225
yarn cli agent:list

# Terminal 1
yarn cli server:start --debug

# Terminal 2
yarn cli agent:start agent --debug

# Terminal 3
yarn cli agent:start worker-1 --debug
```

### Modify Agent Configuration
```bash
yarn cli agent:info worker-1
yarn cli agent:edit worker-1 --port 5000
yarn cli agent:info worker-1          # Verify changes
```

### Clean and Rebuild
```bash
yarn cli clean
yarn build:clean
yarn cli init
```

## System Commands

### macOS (Darwin) Specific
```bash
# Standard Unix commands
ls, cd, grep, find, cat, mkdir, rm, tree

# Check OpenSSL (required)
which openssl
openssl version

# Check NATS Server
which nats-server
nats-server --version
```

### Git Commands
```bash
git status
git log --oneline -10
git diff
git diff --stat
git branch -a
```

### File Operations
```bash
# Find files
find src -name "*.ts"
find src -type f -name "*agent*"

# Search in source
grep -r "CertificateAuthority" src/
grep -rn "TODO" src/              # With line numbers

# Directory structure
tree -L 3 -I "node_modules|dist"
ls -la agents/                     # List agents
```

### Port Management
```bash
# Check if port is in use (macOS)
lsof -i :4222
lsof -i :4223

# Kill process on port
kill -9 <PID>
```

### Process Management
```bash
# Find running nats-server processes
ps aux | grep nats-server

# Kill all nats-server processes
pkill nats-server
```

## Debugging Commands

### Check Generated Files
```bash
# Check certificates
ls -la certs/
ls -la agents/*/certs/

# Check configs
cat config/main.conf
cat agents/agent/config/agent.conf

# Verify certificate details
openssl x509 -in certs/rootCA.crt -text -noout
openssl x509 -in agents/agent/certs/agent.crt -text -noout
```

### NATS Client Testing
```bash
# Install NATS CLI (if not installed)
brew install nats-io/nats-tools/nats

# Test main server
nats pub -s localhost:4222 test "Hello"
nats sub -s localhost:4222 test

# Test agent
nats pub -s localhost:4223 test "Hello from agent"
nats sub -s localhost:4223 test
```

## Prerequisites

- **Node.js**: v18+ (for native TypeScript support)
- **Yarn**: v4.17.0+ (package manager)
- **OpenSSL**: Must be installed and in PATH (for certificate generation)
- **NATS Server**: Required to run servers (nats-server binary)
- **Optional**: NATS CLI tools for testing (nats pub/sub)
