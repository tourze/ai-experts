# Kelly Sizing Playbook

本文件是 kelly-sizing `SKILL.md` 的拆分内容，包含 `scripts/kelly_sizer.mjs` 的输入格式与计算约束。

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

`scripts/kelly_sizer.mjs` 接受直接 brief，也接受包在 `kelly_sizing` 下的聚合输入：

```bash
node scripts/kelly_sizer.mjs input.json --section all --format json
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

CLI 输入：

```json
{
  "capital_base": 100000,
  "confidence_level": "medium",
  "constraints": {
    "total_exposure_cap": 0.25,
    "single_opportunity_cap": 0.10,
    "min_cash_reserve_ratio": 0.50
  },
  "binary": {
    "name": "Paid acquisition test",
    "win_probability": 0.58,
    "win_return_multiple": 1.2,
    "loss_multiple": 1
  }
}
```

## 情景机会

```text
maximize Σ p_i * log(1 + f * r_i)
subject to 1 + f * r_i > 0
```

`r_i` 是每投入 1 单位在情景 `i` 下的净收益倍数。

CLI 输入：

```json
{
  "capital_base": 100000,
  "scenario": {
    "name": "New product launch",
    "confidence_level": "medium",
    "scenarios": [
      { "name": "downside", "probability": 0.30, "return_multiple": -0.40 },
      { "name": "base", "probability": 0.50, "return_multiple": 0.35 },
      { "name": "upside", "probability": 0.20, "return_multiple": 1.20 }
    ]
  }
}
```

情景概率必须加总为 `1`；`return_multiple < -1` 视为超出单次投入亏损边界，脚本会拒绝。

## 多机会分配输入

```json
{
  "capital_base": 100000,
  "confidence_level": "medium",
  "constraints": {
    "total_exposure_cap": 0.25,
    "single_opportunity_cap": 0.10
  },
  "multi": {
    "dependence": "unknown",
    "opportunities": [
      {
        "name": "Channel A",
        "win_probability": 0.58,
        "win_return_multiple": 1.2,
        "loss_multiple": 1
      },
      {
        "name": "Channel B",
        "win_probability": 0.62,
        "win_return_multiple": 0.8,
        "loss_multiple": 1
      }
    ]
  }
}
```

多机会路径会按 `standalone full Kelly -> fractional Kelly -> dependence haircut -> single cap -> total exposure scaling` 处理。未知相关性默认 `unknown = 0.50`，并在输出 `warnings` 中标记。

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
