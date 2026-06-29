# Task Completion Checklist

## When a Task is Completed

Since this project has minimal automation, follow these steps:

### 1. Code Quality (Manual)
- **No linter configured**: Consider adding ESLint
- **No formatter configured**: Consider adding Prettier
- **No pre-commit hooks**: Code quality is manual

### 2. Build Verification
```bash
yarn build              # Verify TypeScript compiles without errors
```

### 3. Manual Testing
Since there are no automated tests, manually verify:
```bash
# Test certificate generation
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
```

### 4. Git Workflow
```bash
git status                          # Check what changed
git add src/                        # Stage source changes
git commit -m "feat: description"  # Commit with conventional commit message
```

### 5. Documentation
- Update CLAUDE.md if architecture changed
- Update README if user-facing features changed
- No JSDoc enforcement, but consider adding for public APIs

## What's NOT automated (but should be)
- ❌ Linting (no ESLint)
- ❌ Formatting (no Prettier)
- ❌ Unit tests (no test framework)
- ❌ Integration tests
- ❌ Type checking in CI
- ❌ Build verification in CI

## Future Improvements
Consider adding:
1. ESLint + Prettier
2. Vitest or Jest for testing
3. Husky for pre-commit hooks
4. GitHub Actions for CI/CD
