---
name: adr
description: >
  MUST USE when working with architectural decision records (ADRs).
  Triggers: evaluating whether a decision warrants an ADR (applying the severity
  gate), creating new ADRs, superseding existing ADRs, listing/reviewing ADRs,
  or linking related ADRs. The skill includes criteria for when NOT to create
  an ADR; not every architectural decision crosses the threshold.
---

# Architecture Decision Records

ADRs document architecturally significant decisions: those affecting structure, non-functional characteristics, dependencies, interfaces, or construction techniques.

## Philosophy

Agile projects still need documentation; they just avoid valueless, unmaintained documentation. Large documents go unread and stale quickly. Small, modular documents can stay current.

Write each ADR as a conversation with a future developer. Keep each ADR to one or two pages.

The goal is to preserve decision motivation so future developers do not:

1. Blindly accept a past decision without understanding whether it is still valid, or
2. Blindly change a past decision without understanding what it protected (including non-functional requirements).

Each ADR balances forces (similar in spirit to an Alexandrian pattern). Forces can appear in multiple ADRs; the single decision is the central piece.

One ADR describes one significant decision for a specific project. ADRs make motivations and trade-offs visible to current and future team members and stakeholders.

## Before Creating an ADR

ADRs exist to preserve decision motivation for future developers. This purpose defines when they are warranted: a decision needs an ADR when losing track of it would cause future harm.

Not every architectural decision meets this threshold. Many decisions involving dependencies, structure, or interfaces are routine and reversible. Creating ADRs for these dilutes the signal, making it harder for future readers to identify the decisions that truly matter.

### Check Project-Specific Criteria First

Projects may define their own ADR thresholds in CONTRIBUTING.md, doc/adr/README.md, or similar locations. When project-specific criteria exist, apply them. They reflect the team's judgment about what matters in their context.

### Default Severity Test

When a project provides no explicit criteria, apply this test. A decision warrants an ADR when it meets one or more of the following:

- **Cross-cutting impact**: The decision affects multiple features, systems, or team boundaries. Reversing it later would require coordination beyond a single developer or component.

- **Precedent-setting**: The decision establishes a pattern that others will follow. Future developers will look to this choice as the canonical approach.

- **Contested trade-off**: The decision resolves a tension where reasonable people could disagree. Without documentation, the same debate will recur.

- **Attribution matters**: The decision needs a record of who decided, under what authority, with what context. This is especially true for decisions with political, compliance, or cross-team implications.

If none of these apply, consider lighter documentation: an issue comment, a code comment, a changelog entry, or inline documentation. An ADR can always be created later if the decision proves more significant than expected.

### When Uncertain

When uncertain whether a decision crosses the threshold, prefer the lighter form. ADR inflation is harder to reverse than ADR absence. A missing ADR can be written retroactively when its importance becomes clear; a cluttered ADR directory obscures the decisions that matter.

## Location and Numbering

Store ADRs in `doc/arch/adr-NNN.md` with sequential, monotonic numbering. Numbers are never reused.

If a decision is reversed, keep the old ADR but mark it as superseded (with a link to its replacement).

Write ADRs as plain text using a lightweight markup format (Markdown or Textile; Markdown preferred).

## ADR Structure

| Section          | Content                                                                                                                       |
|------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Title**        | Short noun phrase: `ADR NNN: [Decision Subject]` (e.g., `ADR 001: Deployment on Ruby on Rails 3.0.10`, `ADR 009: LDAP for Multitenant Integration`) |
| **Context**      | Value-neutral description of forces at play (technological, political, social, project-local). Call out tensions and constraints without advocating for any solution. |
| **Decision**     | Active voice statement beginning with "We will..."                                                                            |
| **Status**       | `Proposed`, `Accepted`, `Deprecated`, or `Superseded` (with link to replacement)                                              |
| **Consequences** | All outcomes: positive, negative, and neutral effects                                                                         |

## Writing Style

- Use full sentences organized into paragraphs.
- Use bullets only for visual grouping, not as an excuse for sentence fragments.
- Avoid bullet-only ADRs. (Bullets kill people.)

## Workflow

The project uses `@meza/adr-tools` to manage ADRs. Read the adr-tools documentation before making structural changes to the ADR set: `https://github.com/meza/adr-tools`.

Always run adr-tools via npx; do not install it globally.

### EXTREMELY IMPORTANT WORKING DIRECTORY

The working directory of the command MUST BE the exact same directory where the `.adr-dir` file is located.
Find that file in the project and use the commands from there.

### Suppressing Editor Launch

The tool opens an editor when `EDITOR` or `VISUAL` environment variables are set. Critically, npm injects its `editor` config (default: `vi`) as the `EDITOR` environment variable during npx execution, overriding any shell-level `EDITOR=` prefix.

To prevent editor launch, wrap the adr command in a subshell that clears `EDITOR` after npm injection:

```bash
npx -y -p @meza/adr-tools -- adr new "Description"
```

### Commands

```bash
npx -y -p @meza/adr-tools -- adr init [directory]                  # Initialize ADR directory
npx -y -p @meza/adr-tools -- adr list                              # List all ADRs
npx -y -p @meza/adr-tools -- adr new "Description"                 # Create new ADR
npx -y -p @meza/adr-tools -- adr supersede [N] "Description"       # Supersede ADR N
npx -y -p @meza/adr-tools -- adr new -l "[N]:Forward:Inverse" "X"  # Create linked ADR
npx -y -p @meza/adr-tools -- adr help                              # Show help
```

Example supersede:

```bash
npx -y -p @meza/adr-tools -- adr supersede 3 "The new decision that supersedes ADR 003"
```

### Linking ADRs

Use linking when a new decision relates to a previous ADR but does not supersede it.

Link format: `"[N]:<ForwardLabel>:<InverseLabel>"` where:

- `N` is the existing ADR number being linked to.
- `ForwardLabel` is the label that will appear on the new ADR pointing to the old ADR.
- `InverseLabel` is the label that will appear on the old ADR pointing to the new ADR.

The tool sets numbering and navigational links on both ADRs.

Example:

```bash
npx -y -p @meza/adr-tools -- adr new -l "3:Amends:Amended by" "Use jest only for pact testing"
```

## Critical Rules

- **Decision changed?** Use `adr supersede`, never edit the original
- **Typo or clarification?** Edit is acceptable
- **Consequences become context** - Later ADRs reference earlier ones
- **Preserve the chain** - Superseded ADRs stay in place, linked to replacements

## Docusaurus Special

If the ADR directory is within a docusaurus setup, you must adjust the front-matter of each ADR.
The slug must be set to the sequence number of the adr.

For example if the filename is `0002-do-something-cool.md`, then the frontmatter must be as follows:
```
---
slug: 0002
---
```


