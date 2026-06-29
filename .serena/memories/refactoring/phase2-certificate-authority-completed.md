# Phase 2: Certificate Authority Module - Completed

## Date: 2026-06-29

## Summary
Successfully completed Phase 2 of the deep modules refactoring - consolidation of certificate generation into a CertificateAuthority module.

## What Was Done

### 1. Created CertificateAuthority Module (`src/features/certificate-authority/certificate-authority.ts`)
- **255 LOC** - Deep module with domain-level interface
- Encapsulates all OpenSSL complexity and certificate generation logic
- Interface methods:
  - `issueRootCA(options)` - generates self-signed Root CA
  - `issueServerCert(ca, options)` - generates server certificate signed by CA
  - `issueLeafCert(ca, name, options)` - generates leaf/agent certificate signed by CA
- Private methods handle:
  - Private key generation
  - CSR (Certificate Signing Request) creation
  - Certificate signing
  - SAN (Subject Alternative Name) extension building
  - Temporary file cleanup (CSR, extension files)

### 2. Created OpenSSL Adapter (`src/features/certificate-authority/adapters/openssl.ts`)
- **31 LOC** - Abstraction for OpenSSL command execution
- `OpenSSLAdapter` interface with 2 methods:
  - `execute(command[], operation)` - runs OpenSSL commands
  - `checkAvailable()` - checks if OpenSSL is in PATH
- `NodeOpenSSL` implementation wraps execSync
- **Clean seam for testing** - allows mocking OpenSSL without running actual commands

### 3. Updated Certificate Generation Callsites
- **CLI commands** (`src/cli.ts`):
  - `init` - uses CA module instead of scattered functions
  - `server:init` - uses CA module
  - `agent:create` - uses CA module via AgentRegistry
- **AgentRegistry** (`src/features/agent/registry.ts`):
  - Updated `create()` method to use CA module for leaf certificates
  - Fixed bug: config now uses final paths (not temp transaction paths)
- Removed imports of old certificate functions

### 4. Comprehensive Tests (`src/features/certificate-authority/__tests__/certificate-authority.test.ts`)
- **11 tests, all passing**
- Mock OpenSSL adapter captures commands without executing them
- Mock filesystem for isolated testing
- Test coverage:
  - Root CA generation (key size, validity, subject fields)
  - Server cert generation (signed by CA, SAN extension, cleanup)
  - Leaf cert generation (custom names, common names)
  - Command structure verification (genrsa, req, x509)

## Files Replaced

### Deleted (can be removed):
- `src/features/ca/generate-root-ca.ts` - logic moved to CA module
- `src/features/server/generate-certificate.ts` - logic moved to CA module
- `src/features/agent/generate-certificate.ts` - logic moved to CA module
- `src/utils/certificate.ts` - logic moved to CA module
- `src/utils/openssl.ts` - became adapter (executeOpenSSL, checkOpenSSLAvailable)

### Created:
- `src/features/certificate-authority/certificate-authority.ts` (255 LOC)
- `src/features/certificate-authority/adapters/openssl.ts` (31 LOC)
- `src/features/certificate-authority/__tests__/certificate-authority.test.ts` (11 tests)

## Metrics

### Before Refactoring:
- Certificate generation: 5 files scattered across features/ca, features/server, features/agent, utils
- OpenSSL commands: exposed in multiple places
- Parameters: 7+ per call (certsDir, caKeyPath, caCertPath, validityDays, keySize, subject, etc.)
- Test coverage: 0 tests for certificate features (only utils)
- SAN extension: logic duplicated

### After Refactoring:
- Certificate generation: 1 CA module (255 LOC) + 1 adapter (31 LOC) = 286 LOC
- OpenSSL commands: encapsulated in adapter, never exposed
- Interface: 3 domain methods with 1-3 parameters each
- Test coverage: 11 comprehensive tests with mock OpenSSL
- SAN extension: centralized in private method `buildSANExtension()`

### Results:
- **Locality**: All certificate logic in one module
- **Leverage**: Simple domain interface (issueRootCA, issueServerCert, issueLeafCert) hides complex OpenSSL orchestration
- **Testability**: Mock OpenSSL adapter, verify command structure without running openssl binary

## Bug Fixed
Fixed critical bug in AgentRegistry: config files were using temporary transaction paths instead of final paths after rename. Now `generateAgentConfig` receives final paths while certificates are generated in temp directory.

## CLI Verification (All Passing)

```bash
✅ yarn cli init                      # Uses CA module for Root CA + server cert
✅ yarn cli server:init               # Uses CA module
✅ yarn cli agent:create test-agent2  # Uses CA module via AgentRegistry
✅ openssl verify -CAfile certs/rootCA.crt certs/main.crt
✅ openssl verify -CAfile certs/rootCA.crt agents/*/certs/*.crt
```

## Test Suite

```bash
✅ 56 tests total (all passing)
   - 11 CertificateAuthority tests (new)
   - 20 AgentRegistry tests
   - 25 existing utility tests
```

## Files Modified
- Created: `src/features/certificate-authority/certificate-authority.ts`
- Created: `src/features/certificate-authority/adapters/openssl.ts`
- Created: `src/features/certificate-authority/__tests__/certificate-authority.test.ts`
- Updated: `src/cli.ts` (replaced scattered cert functions with CA module)
- Updated: `src/features/agent/registry.ts` (use CA module, fix config paths)

## Files to Delete (Later)
These files are now obsolete but retained for reference:
- `src/features/ca/generate-root-ca.ts`
- `src/features/server/generate-certificate.ts`
- `src/features/agent/generate-certificate.ts`
- `src/utils/certificate.ts`
- `src/utils/openssl.ts` (or convert to adapter export only)

## Next Steps: Phase 3
Config Builder module to consolidate NATS config generation (2 duplicated modules → 1 builder).

## Key Achievement
**Zero feature tests → 11 comprehensive tests** with clean OpenSSL abstraction. Certificate generation went from scattered 5-file complexity to **single 255-LOC module with 3-method domain interface**.

## Interface Comparison

### Before (utils/certificate.ts):
```typescript
generateCertificateFromCA({
  name: string,
  commonName: string,
  certsDir: string,
  caKeyPath: string,      // ← OpenSSL detail leaked
  caCertPath: string,     // ← OpenSSL detail leaked
  validityDays: number,
  keySize: number,
  subject: Subject,
}) // 8 parameters, OpenSSL knowledge required
```

### After (CA module):
```typescript
issueRootCA({ certsDir: string, ...opts }) → CAReference
issueServerCert(ca: CAReference, opts)     // 2 params
issueLeafCert(ca: CAReference, name, opts) // 3 params
// Domain concepts only, no OpenSSL leakage
```

Complexity hidden, interface simplified 4x.
