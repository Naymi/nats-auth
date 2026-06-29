# CI/CD Documentation

**Last Updated**: 2026-06-30

## Overview

This project uses GitHub Actions for continuous integration, testing, security scanning, and release automation.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`/`master` branches
- Pull requests to `main`/`master` branches

**Jobs:**

#### Lint & Format
- Runs ESLint on all TypeScript files
- Checks code formatting with Prettier
- Node.js 20

#### Type Check
- Compiles TypeScript to verify types
- Ensures no type errors
- Node.js 20

#### Test
- Runs Vitest test suite
- Generates code coverage report
- Uploads coverage to Codecov (optional)
- Node.js 20

#### Build
- Builds the CLI tool
- Verifies CLI executable works
- Uploads build artifacts
- Runs after lint, typecheck, and test pass
- Node.js 20

#### Test Matrix
- Runs tests across Node.js versions: 18, 20, 22
- Ensures compatibility with multiple Node.js versions
- Runs in parallel with fail-fast disabled

**Concurrency:**
- Cancels in-progress runs for the same PR/branch
- Saves CI minutes and speeds up feedback

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push of version tags (e.g., `v1.0.0`, `v2.1.3`)

**Steps:**
1. Checkout code with full git history
2. Install dependencies and build project
3. Run tests to verify release candidate
4. Package CLI into tarball
5. Generate changelog from git commits
6. Create GitHub Release with artifacts
7. Mark as prerelease if tag contains `alpha`, `beta`, or `rc`

**Permissions:**
- `contents: write` - Required to create releases

**Manual Release Process:**
```bash
# Update version in package.json
npm version patch  # or minor, major

# Push tag to trigger release
git push --follow-tags
```

### 3. Security Workflow (`.github/workflows/security.yml`)

**Triggers:**
- Schedule: Every Monday at 9:00 AM UTC
- Push to `main`/`master` branches
- Pull requests
- Manual dispatch

**Jobs:**

#### Dependency Review
- Runs on pull requests only
- Reviews new dependencies for security issues
- Fails on moderate or higher severity vulnerabilities
- Uses GitHub's dependency review API

#### Audit
- Runs `yarn audit` to check for known vulnerabilities
- Checks only production dependencies
- Continues on error (informational only)

#### CodeQL Analysis
- Static code analysis for security vulnerabilities
- Scans JavaScript/TypeScript code
- Uses `security-extended` query suite
- Results appear in GitHub Security tab

**Permissions:**
- `contents: read` - Read repository contents
- `security-events: write` - Upload CodeQL results

### 4. Documentation Workflow (`.github/workflows/docs.yml`)

**Triggers:**
- Push to `main`/`master` with changes to `*.md` files
- Pull requests with changes to `*.md` files
- Manual dispatch

**Jobs:**

#### Markdown Lint
- Lints all Markdown files
- Enforces consistent style
- Configuration: `.markdownlint.json`

#### Link Check
- Checks all links in Markdown files
- Verifies external links are reachable
- Configuration: `.github/markdown-link-check.json`
- Ignores localhost and 127.0.0.1 URLs

#### Documentation Consistency
- Verifies required documentation files exist:
  - `README.md`
  - `CLAUDE.md`
  - `PRD.md`
  - `QUICKSTART.md`
- Checks for recent update markers
- Warning if dates look outdated

## Configuration Files

### `.markdownlint.json`
Markdown linting rules:
- ATX-style headers (`#` not underlined)
- 2-space indentation for lists
- 120 character line length (code blocks and tables exempt)
- Allows different nesting for duplicate headers
- Allows `<br>`, `<details>`, `<summary>` HTML tags

### `.github/markdown-link-check.json`
Link checking configuration:
- Ignores localhost and 127.0.0.1 URLs
- 20 second timeout per link
- Retries on 429 (rate limit) errors
- 3 retry attempts with 30s delay
- Accepts common redirect status codes

## Badges

Add these badges to README.md:

```markdown
[![CI](https://github.com/YOUR_USERNAME/nats-auth/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/nats-auth/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_USERNAME/nats-auth/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/nats-auth/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/nats-auth/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/nats-auth)
```

## Required Secrets

### Optional (for enhanced features)

#### `CODECOV_TOKEN`
- Upload test coverage to Codecov
- Get from: https://codecov.io
- Set in: Repository Settings → Secrets → Actions

## Local Testing

Test workflows locally before pushing:

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS

# Run CI workflow locally
act push

# Run specific job
act -j test

# Run with secrets
act --secret-file .secrets
```

## Troubleshooting

### CI Failing on Lint
```bash
# Run locally to fix
yarn lint:fix
yarn format
git add .
git commit --amend --no-edit
git push --force-with-lease
```

### CI Failing on Tests
```bash
# Run tests locally
yarn test:run

# Check coverage
yarn test:coverage
```

### Security Alerts
- Check GitHub Security tab
- Review Dependabot alerts
- Update dependencies: `yarn upgrade-interactive`

### Failed Release
- Verify tag format: `v1.2.3` (must start with `v`)
- Check GitHub Actions logs
- Ensure all tests pass before tagging
- Verify `contents: write` permission

## Best Practices

1. **Always run checks locally before pushing**:
   ```bash
   yarn lint && yarn format:check && yarn test:run && yarn build
   ```

2. **Keep dependencies updated**:
   - Review Dependabot PRs regularly
   - Run `yarn audit` monthly
   - Update major versions carefully

3. **Test across Node.js versions**:
   - CI tests on 18, 20, 22
   - Use `.nvmrc` or `package.json#engines` to specify supported versions

4. **Document breaking changes**:
   - Use `feat!:` or `BREAKING CHANGE:` in commits
   - Release notes will automatically include them

5. **Security-first approach**:
   - CodeQL scans every push
   - Dependency review on PRs
   - Regular security audits

## GitHub Actions Documentation

Official GitHub Actions documentation:
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)
- [Actions marketplace](https://github.com/marketplace?type=actions)

## Future Improvements

Consider adding:
- [ ] Automated npm publishing on release
- [ ] Docker image builds
- [ ] Performance benchmarking
- [ ] Visual regression testing for CLI output
- [ ] Automated changelog generation
- [ ] Semantic versioning automation
- [ ] Deploy documentation to GitHub Pages
