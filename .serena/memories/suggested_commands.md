# Suggested Commands

## Development Commands

### Build & Run
```bash
yarn build              # Compile TypeScript to dist/
yarn build:clean        # Clean dist/ and rebuild
yarn cli [command]      # Run CLI in development mode (via tsx)
```

### CLI Commands (Development)
```bash
# Full setup (Root CA + main server + default agent)
yarn cli init

# Main server only (Root CA + server cert + config)
yarn cli server:init

# Default agent only (requires server:init first)
yarn cli agent:init

# Agent management
yarn cli agent:list                           # List all agents
yarn cli agent:create <name> [--port] [--host]  # Create new agent
yarn cli agent:info <name>                    # Get agent details
yarn cli agent:edit <name> [--port] [--host]  # Edit agent config

# Cleanup (removes certs/, config/, agents/)
yarn cli clean
```

### Production CLI (After build)
```bash
node dist/cli.js [command]      # Run built CLI
nats-auth [command]             # If installed globally
```

### Running NATS Servers
```bash
# Main server
nats-server -c config/main.conf

# Default agent
nats-server -c agents/agent/config/agent.conf

# Custom agent
nats-server -c agents/<agent-name>/config/<agent-name>.conf
```

## System Commands

### macOS (Darwin) Specific
```bash
# Standard Unix commands work on macOS
ls, cd, grep, find, cat, mkdir, rm, etc.

# Check OpenSSL (required)
which openssl
openssl version
```

### Git Commands
```bash
git status
git log --oneline -5
git diff
```

### File Operations
```bash
find src -name "*.ts"           # Find TypeScript files
grep -r "pattern" src/          # Search in source
tree -L 3 -I node_modules       # Show directory structure
```

## Prerequisites
- **OpenSSL**: Must be installed and in PATH
- **Node.js**: v20+ (for @types/node compatibility)
- **NATS Server**: Required to actually run the servers (nats-server binary)
