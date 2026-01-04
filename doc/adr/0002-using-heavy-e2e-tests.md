# 2. Using Heavy E2E Tests

Date: 2022-06-22

## Status

Accepted

## Context

The original tool has an [exhaustive test suite](https://github.com/npryce/adr-tools/tree/master/tests) that allows us to make sure that we're backwards compatible.

## Decision

We'll be re-implementing those tests for ourselves too. This means that we will be using the original examples,
expectations and the ethos of invoking the tool with the given examples.

## Consequences

The E2E test suite will be very slow to run and it can only be executed sequentially.
