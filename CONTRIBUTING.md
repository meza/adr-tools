# Contributing

This repo builds and publishes `@meza/adr-tools`, a small Node.js CLI for managing Architecture Decision Records (ADRs).
This guide shows how to set up a working dev environment, run the checks CI runs, and open a PR that is easy to review.

## Prerequisites

- Node.js 22 (CI uses `22.x`)

## Quick start

Install dependencies:

```bash
yarn install
```

Run the full local verification (what CI runs):

```bash
yarn ci
```

## How the repo is laid out

- `src/`: library + CLI entrypoint
- `src/templates/`: ADR templates that ship with the package
- `tests/`: e2e tests (exercise the CLI against a temp workspace)
- `doc/adr/`: ADRs for this repo (the tool itself)

## Development workflow

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

# Clean build artifacts
yarn clean
```

Unit tests run with coverage by default. For e2e coverage, add `--coverage`:

```bash
yarn test:unit
yarn test:e2e --coverage
```

## Required local checks

Before opening a PR, run:

```bash
yarn ci
```

This runs linting and tests in parallel using the repo's configured tooling.

## Code style

- Formatting and linting are enforced with Biome (`biome.json`).
- Keep changes small and focused. Add or update tests when behavior changes.

## Commits and changelog

This repo uses Conventional Commits (enforced by commitlint).

If you want an interactive prompt for commit messages:

```bash
yarn commit
```

## ADRs in this repo

ADRs for this repository live under `doc/adr/`. The location is configured by the `.adr-dir` file in the repo root.

To list ADRs:

```bash
npx -y -p @meza/adr-tools -- adr list
```
