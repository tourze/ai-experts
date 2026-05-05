# ai-experts

This generated surface is managed from `src/components/`.

## Runtime Model

- Instructions are stable session guidance and should stay small.
- Skills contain task workflows plus optional scripts and references.
- Agents isolate long-running or multi-skill work.
- Hooks are event middleware for context injection, guardrails, and telemetry.
- Profiles compose instructions, skills, agents, and hooks into installable surfaces.

## Maintenance Rules

- Do not edit generated files under `dist/` by hand.
- Add or migrate capabilities in `src/components/`, then run `npm run build:components`.
- Register every script, reference, agent, and hook in TypeScript; unregistered resources must fail the build.
- Prefer `new URL("./file", import.meta.url)` for component resources so editors and bundlers can track local files.
- Treat `src/components/` as the only architecture boundary for local AI capabilities.
