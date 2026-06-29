# Codebase Structure

## Directory Layout
```
src/
├── cli.ts                          # Main CLI entry point (Commander.js)
├── features/                       # Domain-driven feature modules
│   ├── ca/                         # Root Certificate Authority
│   │   └── generate-root-ca.ts
│   ├── server/                     # Main NATS server
│   │   ├── generate-certificate.ts
│   │   └── generate-config.ts
│   └── agent/                      # Leaf node agents
│       ├── create-agent.ts         # Create new agent
│       ├── edit-agent.ts           # Edit agent config
│       ├── generate-certificate.ts # Agent certificate generation
│       ├── generate-config.ts      # Agent NATS config generation
│       ├── get-agent-info.ts       # Get agent details
│       └── list-agents.ts          # List all agents
└── utils/                          # Shared utilities
    ├── fs.ts                       # File system operations
    └── paths.ts                    # Path management
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
    ├── config/                     # Agent NATS config
    └── jetstream/                  # Agent JetStream data (runtime)
```

## Key Modules
- **cli.ts**: Orchestrates all commands via Commander.js
- **features/**: Domain-isolated feature implementations
- **utils/fs.ts**: ensureDir, removeDir helpers
- **utils/paths.ts**: Centralized path constants and helpers
