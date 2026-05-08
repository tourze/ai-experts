# Kelly Sizing Playbook

## Opportunity Brief

```text
Decision:
Capital or resource base:
Maximum tolerable loss:
Time horizon:
Confidence level:
Win probability:
Win return multiple:
Loss multiple:
Constraints:
Correlation or dependence:
Evidence quality:
```

## Path Selection

| Path | Use When | Required Inputs |
| --- | --- | --- |
| `binary-bet` | One outcome wins or loses. | `p`, win multiple `b`, loss multiple `a`. |
| `scenario-sizing` | Multiple weighted outcomes. | Scenario probabilities and returns. |
| `multi-opportunity-allocation` | Several opportunities compete for one capital base. | Standalone inputs, caps, dependence groups. |

## Conservative Adjustments

- Use fractional Kelly by default.
- Reduce allocation when confidence is low.
- Apply dependence haircut when opportunities share the same driver.
- Cap single opportunity and total exposure before producing an action.
- Suggest `observe` or `tiny test` when assumptions are weak but potentially learnable.

## Output Template

```markdown
## 建议动作
- no allocation / observe / tiny test / small / medium / large

## 建议投入
- full Kelly:
- fractional Kelly:
- cap-adjusted allocation:

## 关键假设
- probability:
- payoff:
- loss:
- confidence:

## 敏感性
- break-even probability:
- allocation if probability is lower by 10%:
- max tolerable loss:
```
