# Task Completion Checklist

**Last Updated**: 2026-06-30
**Status**: Fully automated code quality and testing

## When a Task is Completed

### 1. Code Quality (Automated)

✅ **Linting configured**: ESLint with TypeScript rules
```bash
yarn lint               # Check for linting errors
yarn lint:fix           # Auto-fix linting errors
```

✅ **Formatting configured**: Prettier
```bash
yarn format             # Format all files
yarn format:check       # Check formatting without modifying
```

### 2. Testing (Automated)

✅ **Test framework**: Vitest configured
```bash
yarn test               # Run tests in watch mode
yarn test:run           # Run tests once (CI mode)
yarn test:ui            # Run tests with UI
yarn test:coverage      # Generate coverage report
```

**Testing requirements**:
- Core modules must have unit tests with mocked adapters
- Commands should have integration tests
- New features must include tests
- Maintain high code coverage (aim for >80%)

### 3. Build Verification

```bash
yarn build              # Verify TypeScript compiles without errors
yarn build:clean        # Clean rebuild
```

### 4. Manual Testing (Functional)

Even with automated tests, verify user-facing functionality:

```bash
# Test full initialization
yarn cli clean
yarn cli init

# Verify files were created
ls -la certs/
ls -la config/
ls -la agents/agent/

# Test agent management
yarn cli agent:create test-agent --port 4224
yarn cli agent:list
yarn cli agent:info test-agent
yarn cli agent:edit test-agent --port 4225
yarn cli agent:info test-agent

# Test server start commands
yarn cli server:start --help
yarn cli agent:start test-agent --help

# Cleanup
yarn cli clean
```

### 5. Documentation Updates

When completing a task, update relevant documentation:

**Architecture changes**:
- Update `CLAUDE.md` if project structure changed
- Update `PRD.md` if design decisions changed
- Update `.serena/memories/` if core patterns changed

**User-facing changes**:
- Update `README.md` if features/commands changed
- Update `QUICKSTART.md` if setup process changed
- Update command help text in `src/cli.ts`

**Code documentation**:
- Add JSDoc comments to public APIs
- Update inline comments for complex logic
- Keep comments up to date with code changes

### 6. Git Workflow

Follow conventional commits:
```bash
git status                              # Check what changed
git add src/ tests/                     # Stage changes
git commit -m "type: description"       # Commit with conventional commit

# Commit types:
# feat: New feature
# fix: Bug fix
# refactor: Code refactoring
# test: Add/update tests
# docs: Documentation updates
# chore: Build process, dependencies
# style: Code style changes
```

### 7. Pre-Commit Checklist

Before committing, ensure:
- [ ] `yarn lint` passes
- [ ] `yarn format:check` passes
- [ ] `yarn test:run` passes
- [ ] `yarn build` succeeds
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No console.log left in code
- [ ] No commented-out code
- [ ] Types are explicit (no `any`)

## Automated Quality Gates

✅ **What IS automated**:
- Linting (ESLint with TypeScript rules)
- Formatting (Prettier)
- Unit tests (Vitest)
- Type checking (TypeScript strict mode)
- Build verification (tsc)

❌ **What's NOT automated** (but could be):
- Pre-commit hooks (consider Husky)
- GitHub Actions CI/CD
- Automated deployment
- Release automation
- Changelog generation

## Testing Strategy

### Core Modules (Unit Tests)
Test with mocked adapters:
```typescript
describe('CertificateAuthority', () => {
  it('should issue root CA', async () => {
    const mockOpenSSL = vi.fn();
    const mockFS = vi.fn();
    const ca = new CertificateAuthority(mockOpenSSL, mockFS);
    
    await ca.issueRootCA();
    
    expect(mockOpenSSL).toHaveBeenCalled();
  });
});
```

### Commands (Integration Tests)
Test with real filesystem, mocked OpenSSL:
```typescript
describe('agent:create command', () => {
  it('should create agent with certificate and config', async () => {
    const tempDir = await mkdtemp('/tmp/test-');
    
    await createAgent({ name: 'test', port: 4224 });
    
    expect(existsSync(`${tempDir}/agents/test/certs/test.crt`)).toBe(true);
  });
});
```

### Validation (Unit Tests)
Test Zod schemas:
```typescript
describe('AgentNameSchema', () => {
  it('should accept valid names', () => {
    expect(AgentNameSchema.parse('my-agent')).toBe('my-agent');
  });
  
  it('should reject invalid names', () => {
    expect(() => AgentNameSchema.parse('invalid!')).toThrow();
  });
});
```

## Code Review Checklist

When reviewing changes:
- [ ] Follows Clean Architecture (core has no infrastructure deps)
- [ ] Follows SOLID principles
- [ ] Has appropriate tests
- [ ] No code duplication
- [ ] Error handling is appropriate
- [ ] Types are explicit
- [ ] Documentation is updated
- [ ] Commit message is clear

## Common Pitfalls to Avoid

### Architecture Violations
- ❌ Importing infrastructure libraries in core modules
- ❌ Skipping dependency injection
- ❌ Duplicating business logic across commands

### Code Quality Issues
- ❌ Using `any` type
- ❌ Leaving console.log in code
- ❌ Commented-out code
- ❌ Hardcoded paths or constants

### Testing Issues
- ❌ Testing implementation details
- ❌ Not using mocks for adapters
- ❌ Skipping cleanup in tests
- ❌ Testing with production OpenSSL

## Continuous Improvement

Consider periodically:
1. Review and update dependencies
2. Improve test coverage
3. Refactor for better maintainability
4. Update documentation
5. Add pre-commit hooks (Husky)
6. Set up CI/CD (GitHub Actions)
