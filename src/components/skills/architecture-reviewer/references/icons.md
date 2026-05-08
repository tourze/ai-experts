# Architecture Diagram Icons

## Node Categories

| Category | Suggested Icon Label | Use For |
| --- | --- | --- |
| User | user | Human actor, admin, customer, operator. |
| Client | browser | Web, mobile, desktop, embedded clients. |
| API | api | Gateway, BFF, public API, internal service endpoint. |
| Service | service | Business service, worker, scheduler. |
| Data | database | OLTP database, cache, warehouse, object store. |
| Messaging | queue | Queue, stream, event bus, pub/sub topic. |
| External | external | SaaS, payment provider, identity provider, partner API. |
| Control | gear | Config, feature flags, orchestration, policy engine. |

## Rules

- Use one icon taxonomy per diagram; do not mix cloud vendor icons with generic icons unless vendor specificity matters.
- Pair each icon with a text label; icons alone are not accessible.
- Keep icon meaning stable across the diagram and legend.
- If the runtime environment is unknown, use generic semantic icons instead of guessing a vendor.

## Minimal HTML Pattern

```html
<article class="node" data-node-id="event-bus" data-icon="queue">
  <h3>Event Bus</h3>
  <p>Publishes asynchronous domain events.</p>
</article>
```
