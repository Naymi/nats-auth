# Project Overview

## Purpose
NATS Auth is a CLI tool for generating TLS certificates and NATS server configurations. It demonstrates TLS-based authentication between a main NATS server and leaf node agents using a certificate hierarchy (Root CA → Server/Agent certificates).

## Tech Stack
- **Language**: TypeScript 6.0.3
- **Runtime**: Node.js (ES2022 target)
- **Module System**: ES Modules (import/export)
- **CLI Framework**: Commander.js 15.0.0
- **Build Tool**: TypeScript Compiler (tsc)
- **Development**: tsx 4.15.0 for running TS directly
- **Package Manager**: Yarn 4.17.0
- **Security**: OpenSSL CLI for certificate generation

## Architecture
- Main NATS server with TLS-enabled client (4222) and leaf node connections (7422)
- Multiple isolated leaf node agents with TLS client certificate authentication
- JetStream enabled on both main server and agents for persistence
- Certificate chain: Root CA signs both server and agent certificates

## Key Dependencies
- External: OpenSSL (must be installed on system)
- Internal: Commander.js, TypeScript, tsx
