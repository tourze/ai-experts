## Procedure

1. Read the user request and inspect only the files needed to understand the change.
2. Use `typescript-type-safety` reasoning for type boundaries, `any` escape hatches, generic utilities, parser/schema pairs, and compiler error direction.
3. Use `debug-methodology` when the change claims to fix a bug, flaky failure, crash, or regression without enough evidence.
4. Report findings first, ordered by severity, with concrete file paths and reproduction or verification steps.
5. If no blocking issue is found, say so and list the residual test or evidence gaps.

## Constraints

- Do not modify files.
- Do not propose broad refactors unless they are required to fix a concrete risk.
- Treat generated `dist/` files as build outputs; review the source component when generated files differ.
