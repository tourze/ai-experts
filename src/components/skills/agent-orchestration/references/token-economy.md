# Tool Token Economy

## Loading Tiers

| Tier | Size | Contents | Strategy |
| --- | --- | --- | --- |
| Always-load | Up to 10 tools | Core read/search/edit/plan tools. | Include full model-facing descriptions. |
| Deferred | Most tools | Rare, domain-specific, or expensive tools. | Expose through ToolSearch or router metadata. |
| Hidden/internal | Runtime helpers | Dispatchers, validators, glue code. | Do not put in the model prompt unless requested. |

## Result Budgeting

Every tool needs a result budget:

- `max_result_size` for inline output.
- truncation policy: head, tail, middle, structured summary, or pagination.
- file-backed output when the result is large but still needed.
- stable handle so the model can request the next page or referenced artifact.

## Cost Controls

- Deduplicate shared tool instructions into one static prompt section.
- Put stable tool descriptions before the cache boundary.
- Put task-specific tool availability and dynamic state after the cache boundary.
- Prefer structured results over prose when the next step is machine processing.
- Track observed tool usage and demote rarely used always-load tools.

## Anti-Patterns

- Loading every possible tool because it is "simpler".
- Returning complete logs or full files by default.
- Mixing UI descriptions with model-facing descriptions.
- Hiding destructive behavior in a generic tool name.
