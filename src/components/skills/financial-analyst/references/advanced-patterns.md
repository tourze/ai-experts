# Advanced Financial Analysis Patterns

## DCF Sensitivity Matrix

Use when valuation depends heavily on terminal growth and discount rate.

```text
Rows: WACC scenarios
Columns: terminal growth or exit multiple scenarios
Cell: implied enterprise value or equity value per share
```

Rules:

- Keep the base case visible.
- Do not use terminal growth greater than or equal to WACC.
- Label assumptions as observed, estimated, or assumed.
- Explain which variable drives the most valuation variance.

## Scenario Analysis With State Rollback

When a model mutates assumptions, each scenario must start from the base state.

```python
base = model.snapshot()
for scenario in scenarios:
    model.restore(base)
    model.apply_assumptions(scenario)
    results.append(model.calculate())
```

Rules:

- Reset model state before every scenario.
- Keep scenario names business-readable.
- Show downside, base, and upside at minimum.

## Portfolio Risk Input

```json
{
  "assets": [
    { "name": "A", "returns": [0.012, -0.008, 0.004] },
    { "name": "B", "returns": [0.006, -0.003, 0.002] }
  ],
  "weights": { "A": 0.6, "B": 0.4 },
  "annualization_factor": 252,
  "confidence_level": 0.95
}
```

Rules:

- Asset return series must have the same frequency and length.
- Weights should sum to 1.
- Report covariance or correlation assumptions when allocation depends on diversification.

## Rolling Risk

Use rolling windows to show whether risk is stable, improving, or deteriorating.

```json
{
  "returns": [0.012, -0.008, 0.004],
  "rolling_window": 60,
  "annualization_factor": 252
}
```

Treat windows below 60 observations as directional only.
