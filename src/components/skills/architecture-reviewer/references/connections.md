# Architecture Diagram Connections

## Connection Types

| Type | Visual Style | Use For |
| --- | --- | --- |
| `realtime` | Solid blue line | Synchronous request/response calls. |
| `event` | Dashed amber line | Asynchronous events, pub/sub, queue messages. |
| `batch` | Dotted green line | Scheduled ETL, exports, imports, reporting loads. |
| `control` | Long-dash purple line | Config, policy, rollout, orchestration, management plane. |
| `default` | Neutral solid line | Relationship is known but protocol or timing is not confirmed. |

## Label Rules

- Label edges only when the protocol, payload, or risk is important.
- Put sensitive data markers on the edge, not only on the node.
- Use arrow direction to show data/control direction, not organizational ownership.
- Do not draw inferred connections as facts; mark them as assumptions in the legend.

## Example

```html
<line class="connection realtime" data-from="web-app" data-to="api-gateway" />
<line class="connection event" data-from="api-gateway" data-to="event-bus" />
<line class="connection batch" data-from="warehouse-loader" data-to="warehouse" />
<line class="connection control" data-from="config-service" data-to="api-gateway" />
```
