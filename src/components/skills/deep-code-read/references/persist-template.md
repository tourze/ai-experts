# Persistent Skill Template

Use this template when converting a repository analysis into a reusable skill.

```markdown
# {{PROJECT_NAME}} Codebase Knowledge

## 适用场景

- {{When this codebase knowledge should be used.}}

## 核心约束

- Source version: {{commit/tag}}.
- Treat generated knowledge as read-only context unless the user asks for edits.
- Verify changed behavior against current source before acting on old conclusions.

## 工作流

1. Identify the subsystem or question.
2. Load the relevant module notes.
3. Check source paths for drift.
4. Answer with file-level evidence and uncertainty.

## Module Map

| Module | Source Paths | Responsibilities | Risks |
| --- | --- | --- | --- |
| {{module}} | {{paths}} | {{responsibility}} | {{risk}} |

## Key Concepts

{{Concepts needed to work effectively in this repository.}}

## Validation Questions

- {{Question Agent B used for closed-book validation.}}

## Known Gaps

- {{Unverified or changing areas.}}
```
