# Project Overview

## Purpose
NATS Auth is a CLI tool for generating TLS certificates and NATS server configurations. It demonstrates TLS-based authentication between a main NATS server and leaf node agents using a certificate hierarchy (Root CA → Server/Agent certificates).

**Last Updated**: 2026-06-30
**Architecture Style**: Clean Architecture with SOLID principles
**Major Refactoring**: Completed 2026-06-29 (eliminated ~40% code duplication)

## Tech Stack
- **Language**: TypeScript 5.0+
- **Runtime**: Node.js 18+ (ES2022 target)
- **Module System**: ES Modules (import/export)
- **CLI Framework**: Commander.js 15.0.0
- **Validation**: Zod 4.4.3
- **Testing**: Vitest 4.1.9
- **Build Tool**: TypeScript Compiler (tsc)
- **Development**: tsx 4.15.0 for running TS directly
- **Package Manager**: Yarn 4.17.0
- **Security**: OpenSSL CLI for certificate generation
- **Prompts**: @inquirer/prompts 8.5.2 for interactive CLI

## Architecture
- **Clean Architecture**: Core domain logic isolated in `src/core/`, zero infrastructure dependencies
- **SOLID Principles**: Applied throughout (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **Dependency Injection**: Container-based DI for all core services
- **Adapter Pattern**: OpenSSL and filesystem operations abstracted behind interfaces
- **Main NATS server**: TLS-enabled client (4222) and leaf node connections (7422)
- **Multiple isolated leaf node agents**: TLS client certificate authentication, configurable ports/hosts
- **JetStream**: Enabled on both main server and agents for persistence and streaming
- **Certificate chain**: Root CA signs both server and agent certificates

## Key Dependencies
- **External**: OpenSSL (must be installed on system), NATS Server (for running)
- **Internal**: Commander.js, Zod, Vitest, @inquirer/prompts, get-port
