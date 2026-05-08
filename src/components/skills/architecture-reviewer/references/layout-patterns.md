# Architecture Diagram Layout Patterns

## Patterns

| Pattern | Use When | Layout Rule |
| --- | --- | --- |
| Layered | Showing request flow through client, edge, app, and data layers. | Place entry points left/top and persistence right/bottom. |
| Zone-based | Showing ownership, network, tenant, or trust boundaries. | Draw zones first, then place nodes inside them. |
| Hub-and-spoke | Showing one broker, gateway, or platform service used by many systems. | Keep the hub central and group spokes by concern. |
| Pipeline | Showing ordered batch or streaming processing. | Use one dominant direction and avoid crossing arrows. |
| Before/after | Comparing current and target architecture. | Use two separate diagrams or mirrored halves with identical categories. |

## Density Limits

- Prefer 7-12 primary nodes per diagram.
- Split diagrams when there are more than 4 nested zones.
- Collapse repeated nodes into a group when the exact instances do not change the decision.
- Move implementation details to a table when they make lines cross.

## Checklist

- Is the main reading direction obvious?
- Are trust boundaries visible before individual nodes?
- Are high-risk or stateful components easy to locate?
- Does every zone have a purpose beyond decoration?
