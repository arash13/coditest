# Coditest

A disposable, public test repository for end-to-end task audits with Codispect.

## Workflow

1. Create one scoped GitHub Issue with explicit acceptance criteria.
2. Implement the issue in a dedicated branch and open a Pull Request targeting `main`.
3. Include an explicit issue-closing reference such as `Closes #1` in the Pull Request description.
4. Run a Codispect Audit Task against the implementation PR.
5. Apply any justified repair instructions in a new commit and re-audit.

Keep the original Issue and its acceptance criteria stable while testing. Do not merge a PR before its first audit.

## Exercise conventions

- Exercises use JavaScript ESM and Node.js 24 with the built-in `node:test` runner, unless an Issue explicitly specifies otherwise.
- Prefer small, independently verifiable changes without third-party runtime dependencies.
- Provide deterministic automated tests for every acceptance criterion.
- Treat this repository as test-only: no real secrets, credentials, customer data, or production deployments.
