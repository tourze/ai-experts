# Kelly Sizing Playbook

## Brief 字段

```json
{
  "case_type": "binary-bet | scenario-sizing | multi-opportunity-allocation",
  "objective": "long-term growth with capped drawdown",
  "capital_base": 100000,
  "constraints": {
    "total_exposure_cap": 0.25,
    "single_opportunity_cap": 0.10,
    "min_cash_reserve_ratio": 0.50
  },
  "opportunities": [],
  "confidence_level": "high | medium | low | very_low"
}
```

## 三种路径

- `binary-bet`：一个机会、赢输结构清楚、能给胜率、赢时收益倍数 `b` 和输时损失倍数 `a`；只有 decimal odds 时默认 `a = 1`。
- `scenario-sizing`：一个机会，但更适合用 `2-5` 个收益情景表达。
- `multi-opportunity-allocation`：多个机会竞争同一个资金或资源池。

## 二元机会

```text
win return per 1 unit allocated: +b
loss per 1 unit allocated: -a
f* = (p * b - q * a) / (a * b)
q = 1 - p
```

当 `a = 1` 时，公式退化为常见 full-stake loss Kelly：`f* = (b * p - q) / b`。

## 情景机会

```text
maximize Σ p_i * log(1 + f * r_i)
subject to 1 + f * r_i > 0
```

`r_i` 是每投入 1 单位在情景 `i` 下的净收益倍数。

## 默认折扣

| 置信度 | fractional Kelly |
|--------|------------------|
| `high` | `0.50` |
| `medium` | `0.25` |
| `low` | `0.10` |
| `very_low` | `0.00-0.05` |

| 相关性 | haircut |
|--------|---------|
| `independent` | `1.00` |
| `low` | `0.85` |
| `medium` | `0.65` |
| `high` | `0.50` |
| `unknown` | `0.50` |
| `exclusive` | 优先排序和分阶段；必须同时分配时按 `0.50` |

## No Allocation 触发器

- expected edge 非正。
- 优势符号依赖一个脆弱假设。
- 下行没有上限或未建模。
- 费用、滑点、税、流动性大概率吞掉优势。
- 用户用的是应急资金、关键经营现金或不可承受亏损的资源。
