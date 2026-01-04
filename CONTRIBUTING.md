# Contributing

This repo builds and publishes `@meza/adr-tools`, a small Node.js CLI for managing Architecture Decision Records (ADRs).
This guide shows how to set up a working dev environment, run the checks CI runs, and open a PR that is easy to review.

## Prerequisites

- Node.js 22 (CI uses `22.x`)
- Corepack (ships with Node; used to run Yarn reliably)

## Quick start

Install dependencies:

```bash
corepack enable
corepack yarn install --pure-lockfile
```

Run the full local verification (what CI runs):

```bash
corepack yarn ci
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
corepack yarn lint

# Unit tests (under src/)
corepack yarn test:unit

# E2E tests (under tests/)
corepack yarn test:e2e

# Build dist/ (tsc + template copy)
corepack yarn build

# Clean build artifacts
corepack yarn clean
```

If you want coverage reports locally, add `--coverage`:

```bash
corepack yarn test:unit --coverage
corepack yarn test:e2e --coverage
```

## Required local checks

Before opening a PR, run:

```bash
corepack yarn ci
```

This runs linting and tests in parallel using the repo's configured tooling.

## Code style

- Formatting and linting are enforced with Biome (`biome.json`).
- Keep changes small and focused. Add or update tests when behavior changes.

## Commits and changelog

This repo uses Conventional Commits (enforced by commitlint).

If you want an interactive prompt for commit messages:

```bash
corepack yarn commit
```

Do not edit `CHANGELOG.md` in PRs unless you are fixing an obvious mistake; releases are handled by semantic-release.

## ADRs in this repo

ADRs for this repository live under `doc/adr/`. The location is configured by the `.adr-dir` file in the repo root.

To list ADRs:

```bash
npx -y -p @meza/adr-tools -- adr list
```

## CI and releases (maintainers)

CI runs `corepack yarn ci` on PRs and on pushes to `main` and `next`.
Releases are performed via semantic-release and require credentials; they are typically handled by maintainers.

## Windows verification (maintainers)

If you have access to the Windows verification host, follow `winstructions.md`.
