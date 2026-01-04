# 4. Gate editor opening behind --open and --open-with

Date: 2026-01-04

## Status

Accepted

## Context

This tool historically tries to open a newly created ADR in the user's editor by reading the `VISUAL` and `EDITOR`
environment variables.

In 2025, a common way to run Node CLIs is via `npx`/`npm exec`. npm injects an `EDITOR` value into child processes
based on npm config (`npm_config_editor`), even when the user did not intend to configure an editor for this tool.

This creates two classes of problems:

1. Unwanted side effects. Creating an ADR can unexpectedly launch an editor or attempt to launch a placeholder value.
2. Cross-platform friction. Windows shells, quoting rules, and editor invocation are inconsistent, making the default
   "auto open" behavior more fragile than the rest of the CLI.

We still want a good "create and open" workflow, but it must be explicit and predictable, and it must work well on
Windows, macOS, and Linux.

## Decision

We will stop automatically opening an editor after `adr new` by default.

We will add two flags to the CLI:

- `--open`: Open the newly created ADR file after creation.
- `--open-with <command>`: Open the newly created ADR file using the provided command (optionally including args).

When `--open` is supplied, the tool will select an opener in this order:

1. `--open-with <command>` if provided.
2. `VISUAL` if it is set by the user and not empty.
3. `EDITOR` if it is set by the user and not empty.
4. OS default application for the file type.

To handle cross-platform differences, we will use a dedicated dependency (`open`) to perform the actual launching
when possible, rather than building platform-specific process spawning logic in this project.

## Consequences

This makes ADR creation deterministic and side-effect free by default, including when invoked via `npx` or within CI.

Users who want the "open after create" workflow can still have it, but must opt in via `--open` or explicitly specify
an opener via `--open-with`.

This reduces platform-specific bugs and maintenance burden by relying on a well-maintained cross-platform opener.

This is a breaking behavior change for users who relied on implicit editor opening when `VISUAL`/`EDITOR` were set,
but the new behavior is more predictable and better aligned with modern Node execution environments.
