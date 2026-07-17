# Contributing

This repo builds and publishes `@meza/adr-tools`, a small Node.js CLI for managing Architecture Decision Records (ADRs).
This guide shows how to set up a working dev environment, run the checks CI runs, and open a PR that is easy to review.

## Prerequisites

- Node.js 22.13 or later (CI uses `24.x`)

## Quick start

Install dependencies:

```bash
yarn install
```

Run the full local verification (what CI runs):

```bash
yarn ci
```

## Contributing to the codebase

### Design Principles

- **Simplicity**: Keep the codebase simple and easy to understand.
- **Consistency**: Follow established patterns and conventions throughout the codebase.
- **Testability**: Ensure that all code is easily testable, with a focus on unit tests.
- **Maintainability**: Write code that is easy to maintain and extend in the future.
- **Documentation**: Keep documentation up to date and clear, especially for new features and changes.
- **Error Handling**: Implement robust error handling to provide clear feedback to users and developers.
- **Performance**: Optimize for performance where necessary, but prioritize clarity and maintainability.
- **Security**: Follow best practices for security, especially when handling user data or network requests.
- **Modularity**: Structure the code in a modular way to allow for easy updates and changes without affecting the entire codebase.
- **Monitoring**: Using the telemetry system to monitor usage patterns and improve the user experience based on real data.
- **Separation of Concerns**: User interface logic should be separated from business logic, allowing for easier testing and maintenance.

### Software Hygiene
- **Boy Scout Rule**: Leave code cleaner than you found it
- Clear separation of concerns
- Meaningful variable and function names
- Proper error handling
- No magic numbers or hardcoded values
- Follow existing patterns and conventions

### Development workflow

1. Verify that the local verification checks pass before your work
2. identify the problem/feature to be solved
3. use a TDD approach to deliver the solution
4. run the required verification checks
5. commit with conventional commit messages


### Verification gates - non-negotiable

- The resulting app and the development workflow is cross-platform compatible across linux, windows and macos
- `yarn ci` passes
- 100% _meaningful_ test coverage

## Good to know

### Run the CLI locally

You can run the CLI directly from source:

```bash
npx -y tsx src/index.ts --help
```

### Common commands

All commands are defined in `package.json`. Prefer running scripts instead of calling tool binaries directly.

```bash
# Lint + typecheck
yarn lint

# Unit tests (under src/)
yarn test:unit

# E2E tests (under tests/)
yarn test:e2e

# Build dist/ (tsc + template copy)
yarn build

# Validate the npm package contents and entry points
yarn check:package

# Clean build artifacts
yarn clean
```

Unit tests run with coverage by default. For e2e coverage, add `--coverage`:

```bash
yarn test:unit
yarn test:e2e --coverage
```

### ADRs in this repo

ADRs for this repository live under `doc/adr/`. The location is configured by the `.adr-dir` file in the repo root.

To list ADRs:

```bash
npx -y -p @meza/adr-tools -- adr list
```
