# ADR-TOOLS

> This is a Typescript fork of Nat Pryce's [ADR-TOOLS](https://github.com/npryce/adr-tools).
>There are a few other forks out there which do some parts of the original tool but none actually do it fully.
>This does.
>More documentation to follow very soon!

# Using ADRs

If you’re interested in reading more about what ADRs are and why they’re important, [check this article out](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## **ADR Location Convention**

By convention we store the decisions in **<project_root>/docs/decisions**

You can also check where the directory is by inspecting the **.adr-dir** file’s contents.

## **ADR CLI in node land**

Managing the files and templates by hand is laborious and is not expected from anyone. We have a tool capable of handling that.

You can install it by running

```
npm install --save-dev @meza/adr-tools
```

This will give you the following shorthands:

### **Creating new records**

```
adr new A new decision the team has made
```

This will automatically figure out the numbering sequence, get the correct filename format and use the title inside of an ADR template.

If you have an EDITOR or VISUAL environment variable set, that editor will open the newly created file.

### **Superseding previous decisions**

We work in an agile environment where we aim to fail fast. Some of our decisions will turn out to be invalid within a new context. In those situations we would want to record a new decision to supersede our previous one.

Let’s say we had a decision “[0003-use-jest-for-testing.md](http://0003-use-jest-for-testing.md/)” but we recently learned that vitest is faster. Then we would want to record that but also update 0003 to reflect the fact that it’s no longer valid.

```
adr new -s 3 Use vitest for testing
```

The -s flag tells the tool to update record #3 with a link to the newly created decision.

### **Linking decisions**

Sometimes there are situations when a new decision has another type of link to a previous record and not a supersede.

That can be expressed as follows:

```
adr new -l "3:Amends:Amended by" use jest only for pact testing
```

This will link the new and old issues together. The old one will get a link looking like “Amended by: Use jest only for pact testing” while the newly created ADR will have a section saying: “Amends: Use Jest For Testing”. Both with the appropriate numbering and navigational links set up.

### **Other things**

There’s more to the tool. You can get help with

```
adr help
```

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
