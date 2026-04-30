---
name: kelly-sizing
description: 当用户要用 Kelly Criterion / 凯利公式决定投注、投资或资源池分配比例，评估 full Kelly、fractional Kelly、相关性 haircut、暴露上限或无优势不下注时使用。
---

# Kelly Sizing

## 适用场景

- 用户问“这个机会该不该投 / 下多少 / 分配多少预算或资源”。
- 机会可以是投注、投资、营销预算、工程人力、实验名额或其他有上限资源池。
- 已知或可估算胜率、赔率、情景收益、亏损边界、资金池和风险约束。
- 只要组合风险指标如 VaR / Sharpe / 回撤，转 [risk-metrics-calculation](../risk-metrics-calculation/SKILL.md)；要做 DCF 或财务模型，转 [creating-financial-models](../creating-financial-models/SKILL.md)。

## 核心约束

- 默认使用 `fractional Kelly`，不要把 full Kelly 当成可直接执行的仓位。
- 每个关键数字必须标注 `observed`、`estimated` 或 `assumed`。
- 多机会分配时，未知相关性按 `unknown = 0.50` haircut 处理，不假装独立。
- 无正期望、下行不封顶、边际优势被费用/税/流动性吞掉、或使用应急资金时，建议 `no allocation`、`observe` 或 `tiny test`。
- 这不是持牌投资、法律或税务建议；高风险场景只给 sizing 方法和风险边界。

## 执行流程

1. 先把自然语言整理成 brief，字段见 [sizing playbook](references/sizing-playbook.md)。
2. 判断路径：`binary-bet`、`scenario-sizing` 或 `multi-opportunity-allocation`。
3. 计算 full Kelly；二元机会必须先确认赢时收益倍数 `b` 和输时损失倍数 `a`，再应用 fractional Kelly、相关性 haircut、单机会 cap 和总暴露 cap。
4. 输出 action first：先给 `no allocation / observe / tiny test / small / medium / large`，再给公式。

## 代码模式

```text
binary:
b = net profit multiple per 1 unit allocated
p = win probability
q = 1 - p

full-stake loss:
f* = (b * p - q) / b

decimal odds:
f* = (p * O - 1) / (O - 1)

partial-loss binary:
a = loss multiple per 1 unit allocated
f* = (p * b - q * a) / (a * b)
constraint: 0 < a <= 1 and 1 - f * a > 0
```

```text
multi-opportunity:
standalone full Kelly
-> fractional Kelly
-> dependence haircut
-> single cap
-> total exposure scaling
```

## 输出契约

```markdown
## 建议动作
## 建议投入
## 公式路径
## 关键假设
## 敏感性与风险
```

## 检查清单

- [ ] 资金池、最大亏损、现金/资源保留和总暴露上限已明确或标为假设。
- [ ] 胜率、赔率或情景概率加总合理，且赢时收益倍数 `b`、输时损失倍数 `a` 或情景收益 `r_i` 已建模。
- [ ] full Kelly 与 conservative Kelly 都展示，但执行建议使用 conservative Kelly。
- [ ] 多机会分配已考虑相关性 haircut 和总暴露 cap。
- [ ] 负边际、脆弱假设或不可承受下行已触发 no allocation / observe / tiny test。

## 反模式

### FAIL: full Kelly 直接下注

```
Full Kelly = 32%
建议：直接投 32%
→ 胜率估计略错就会造成不可接受回撤
```

### PASS: 分数 Kelly + 上限

```
Full Kelly = 32%
confidence = low -> 0.10 Kelly
single cap = 5%
建议执行仓位 = min(3.2%, 5%) = 3.2%
```

### FAIL: 相关机会当独立

```
机会 A/B/C 都押同一个宏观变量
每个算 8%，合计 24%
→ 实际上同涨同跌，组合风险被低估
```

### PASS: 相关性 haircut

```
standalone 合计 24%
dependence = unknown -> haircut 0.50
total exposure = 12%，再检查现金保留和总 cap
```
