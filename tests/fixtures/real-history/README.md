## Real Session Fixture

This folder stores **sanitized** real session samples copied from local runtime history:

- `~/.claude/history.jsonl`
- `~/.codex/history.jsonl`
- `~/.codex/sessions/**/*.jsonl`
- `~/.claude/hook-telemetry/decisions.jsonl`

### Files

- `generate-fixtures.mjs`: reads recent local samples and applies redaction.
- `sanitized-session-fixture.json`: committed fixture used by tests.

### Redaction Rules

The generator masks sensitive patterns before writing fixtures:

- absolute paths (`/Users/...`, `C:\...`)
- UUIDs and long hex ids
- emails and IPs
- API-like tokens (`sk-...`, `AKIA...`)
- raw session/plugin ids (stored as short hashes only)

### Refresh Fixture

Run from repo root:

```bash
npm run fixtures:real-history
```

Then run tests:

```bash
npm test
```
