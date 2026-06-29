# Codebase Structure

**Last Updated**: 2026-06-30
**Architecture**: Clean Architecture with SOLID principles

## Directory Layout

```
src/
├── cli.ts                          # Main CLI entry point (Commander.js)
│
├── core/                           # Core domain logic (zero infrastructure dependencies)
│   ├── certificates/               # Certificate management
│   │   ├── authority.ts            # CertificateAuthority class
│   │   └── adapters/
│   │       ├── openssl.ts          # OpenSSL command execution adapter
│   │       └── filesystem.ts       # Certificate file I/O adapter
│   ├── config/                     # NATS configuration
│   │   ├── builder.ts              # NATSConfigBuilder class
│   │   └── defaults.ts             # Default configuration constants
│   ├── agent/                      # Agent management
│   │   ├── registry.ts             # AgentRegistry class (lifecycle operations)
│   │   └── paths.ts                # Agent path helpers
│   ├── domain/                     # Domain models
│   │   └── agent-name.ts           # AgentName value object
│   ├── validation/                 # Validation logic
│   │   ├── schemas.ts              # Pure Zod schemas
│   │   └── validators.ts           # Runtime validation functions
│   └── container.ts                # Dependency injection container
│
├── commands/                       # CLI command implementations (thin orchestration layer)
│   ├── server/
│   │   ├── generate-config.ts      # Server NATS configuration
│   │   └── start.ts                # Start main server
│   └── agent/
│       ├── create.ts               # Create new agent
│       ├── edit.ts                 # Edit agent configuration
│       ├── generate-config.ts      # Agent NATS configuration
│       ├── info.ts                 # Get agent details
│       ├── list.ts                 # List all agents
│       └── start.ts                # Start agent
│
├── shared/                         # Shared utilities (cross-cutting concerns)
│   ├── fs.ts                       # File system helpers (ensureDir, removeDir)
│   ├── logger.ts                   # Logging utilities
│   └── paths.ts                    # Global path constants
│
└── types/                          # Global type definitions
    └── nats-config.ts              # NATS configuration interfaces
```

## Generated Runtime Structure

```
certs/                              # Generated certificates (gitignored)
├── rootCA.key/crt                  # Root Certificate Authority
└── main.key/crt                    # Main server certificate

config/                             # Generated configs (gitignored)
└── main.conf                       # Main server NATS config

agents/                             # Agent directories (gitignored)
└── <agent-name>/                   # Each agent isolated
    ├── certs/                      # Agent certificates
    │   ├── <agent-name>.key
    │   └── <agent-name>.crt
    ├── config/                     # Agent NATS config
    │   └── <agent-name>.conf
    └── jetstream/                  # Agent JetStream data (runtime-created)

jetstream/                          # Main server JetStream data (runtime-created)
```

## Key Modules

### Core Layer (Business Logic)

- **CertificateAuthority** (`core/certificates/authority.ts`): Consolidates all certificate generation logic
  - Methods: `issueRootCA()`, `issueServerCert()`, `issueLeafCert()`
  - Delegates to adapters (OpenSSL, Filesystem)
  - No infrastructure dependencies

- **AgentRegistry** (`core/agent/registry.ts`): Central registry for agent lifecycle
  - Methods: `create()`, `get()`, `list()`, `update()`, `delete()`, `exists()`
  - Port conflict detection and automatic allocation
  - Transaction support with rollback

- **NATSConfigBuilder** (`core/config/builder.ts`): Configuration generation
  - Methods: `serverConfig()`, `leafNodeConfig()`
  - Template-based, type-safe config building
  - Pure functions, no side effects

- **AgentName** (`core/domain/agent-name.ts`): Domain value object
  - Encapsulates agent naming rules
  - Immutable design

- **Container** (`core/container.ts`): Dependency injection
  - Creates and wires core services
  - Manages adapter instances

### Commands Layer (Orchestration)

Thin wrappers that:
- Parse CLI arguments
- Call core modules via dependency injection
- Display results to user
- Handle CLI-specific concerns (colored output, emojis)

### Shared Layer (Utilities)

- **fs.ts**: Directory management
- **paths.ts**: Centralized path constants
- **logger.ts**: Colored console output

## Architectural Principles

1. **Core domain logic isolated**: `src/core/` has zero dependencies on infrastructure
2. **Dependency Injection**: All external dependencies injected via constructor
3. **Adapter Pattern**: OpenSSL and filesystem abstracted behind interfaces
4. **Single Responsibility**: Each module has one clear purpose
5. **Transaction Pattern**: Atomic operations with automatic rollback
6. **Value Objects**: Domain concepts encapsulated in immutable classes
