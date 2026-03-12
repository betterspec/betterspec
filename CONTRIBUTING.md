# Contributing to forgelore

Thank you for your interest in contributing to forgelore! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, constructive, and inclusive. We're building tools for collaborative development — let's model that in how we work together.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/forgelore/forgelore/issues) to report bugs or request features
- Check existing issues before creating a new one
- Include reproduction steps, expected behavior, and actual behavior for bug reports

### Pull Requests

All changes to `main` must come through pull requests. Direct pushes to `main` are not allowed.

1. **Fork the repository** and create a branch from `main`
2. **Name your branch** descriptively: `feat/your-feature`, `fix/bug-description`, `docs/what-changed`
3. **Make your changes** following the guidelines below
4. **Test your changes** — run `bun test` in the relevant package
5. **Submit a pull request** with a clear description of what and why

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/forgelore.git
cd forgelore

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test --filter core
bun test --filter cli
```

### Project Structure

This is a Turborepo monorepo with two packages:

- `packages/core` — `@forgelore/core` — spec engine, config, knowledge base, capabilities, drift detection
- `packages/cli` — `@forgelore/cli` — CLI commands, UI, banner

### Code Guidelines

- **Language**: TypeScript (strict mode)
- **Runtime**: Bun
- **Build**: tsup (ESM only)
- **Style**: No explicit linter config — follow existing patterns in the codebase
- **Tests**: Vitest — add tests for new functionality
- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

### Spec-Driven Development

forgelore dogfoods itself. For significant changes:

1. Run `forgelore propose "your idea"` to create a change spec
2. Fill in requirements, scenarios, design, and tasks
3. Run `forgelore verify <change-name>` to validate completeness
4. Implement from the spec
5. Archive when done with `forgelore archive <change-name>`

This isn't required for small fixes, but it's encouraged for new features.

## Questions?

Open a [discussion](https://github.com/forgelore/forgelore/discussions) or an issue. We're happy to help.
