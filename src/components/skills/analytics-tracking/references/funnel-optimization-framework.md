# Funnel Optimization Framework

## Step 1: Normalize The Funnel

Use one row per stage:

```text
visit -> signup -> activation -> paid
```

For each stage, capture:

- `users_entered`
- `users_completed`
- `conversion_rate`
- `absolute_dropoff`
- `relative_dropoff`
- tracking confidence

## Step 2: Classify The Bottleneck

| Bottleneck | Evidence | Typical Fix |
| --- | --- | --- |
| Traffic quality | Low signup rate from one audience or channel. | Audience, keyword, creative, or landing page alignment. |
| Value clarity | High bounce or low signup across channels. | Above-the-fold message, proof, pricing clarity. |
| Activation friction | Signup is healthy but activation drops. | Onboarding, permissions, empty state, first success path. |
| Monetization friction | Activation is healthy but paid conversion drops. | Packaging, trial wall, pricing, sales handoff. |
| Tracking gap | Sudden stage shift after tag or release change. | Event validation before business interpretation. |

## Step 3: Prioritize Experiments

Rank candidates by:

1. Absolute users affected.
2. Revenue proximity.
3. Confidence in tracking.
4. Implementation effort.
5. Time to readout.

Do not optimize a stage until its upstream event definitions are stable.
