# Tool Specification

## Required Fields

| Field | Purpose |
| --- | --- |
| `id` | Stable machine name used by the agent runtime. |
| `description()` | Short user-facing label. |
| `prompt()` | Model-facing usage guidance, including when not to use the tool. |
| `input_schema` | Strict typed input contract. |
| `output_schema` | Expected result shape or result envelope. |
| `is_read_only` | Whether the tool can mutate state. |
| `is_destructive` | Whether the tool can delete, overwrite, spend money, or trigger irreversible work. |
| `is_concurrent_safe` | Whether multiple calls can run safely in parallel. |
| `max_result_size` | Maximum result size before truncation, pagination, or file-backed output. |

## Prompt Description Pattern

```text
Use this tool when ...
Do not use this tool when ...
Prefer TOOL_X instead when ...
Inputs must include ...
Outputs are ...
```

## Permission Metadata

- Metadata belongs to the tool, not to a central switch statement.
- Defaults must be conservative when a field is missing.
- `is_read_only=true` does not automatically mean safe; sensitive reads may still require confirmation.
- `is_destructive=true` should route through the permission pipeline even if the user requested autonomy.

## Review Checklist

- Does the tool have one clear responsibility?
- Is the input schema narrower than free-form text where possible?
- Is the output bounded and machine-readable?
- Are failure modes explicit?
- Is there a test for the permission metadata?
