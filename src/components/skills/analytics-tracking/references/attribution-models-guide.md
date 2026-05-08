# Attribution Models Guide

## Model Choice

| Model | Use When | Main Risk |
| --- | --- | --- |
| First-touch | Measuring demand creation and acquisition sources. | Overcredits awareness channels. |
| Last-touch | Measuring closing channels and retargeting. | Undervalues early education. |
| Linear | Early baseline when journeys have few known touches. | Treats weak and strong touches equally. |
| Time-decay | Longer journeys where recent activity matters more. | Can hide durable upstream influence. |
| Position-based | Both acquisition and close need explicit credit. | Middle touches can become underweighted. |

## Interpretation Rules

- Report the attribution window, conversion definition, and deduplication rule before comparing channels.
- Run at least two models when budget changes are being considered.
- Treat model disagreement as a signal to inspect the journey, not as an error to average away.
- Do not compare platform-reported attribution against GA4 without aligning click/view windows.

## Output Pattern

```text
Finding:
- Last-touch credits paid search with 42% of revenue.
- First-touch credits organic content with 51% of revenue.

Interpretation:
- Paid search is likely closing demand created elsewhere.
- Budget action should protect organic content and test paid search efficiency, not blindly move all spend.
```
