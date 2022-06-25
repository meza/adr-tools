# ADR-TOOLS

This is a Typescript fork of Nat Pryce's [ADR-TOOLS](https://github.com/npryce/adr-tools).

There are a few other forks out there which do some parts of the original tool but none actually do it fully.

This does.

## Conventions

An ADR file MUST have a `# title` at the top and a `## Status` header.

## Local Development

`yarn install`

### Commits

This project uses conventional commits. See [conventional-commits](https://www.conventionalcommits.org/en/v1.0.0/).

There are git hooks that check the commit messages and enforce the commit rules.
There is a helper tool to make it easier to create commits when unfamiliar with the rules:

`yarn commit`

This will use the [commitlint prompt tool](https://commitlint.js.org/#/guides-use-prompt) to help you create commits.
