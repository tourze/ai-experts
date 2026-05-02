# 风险指标技能

## 适用场景

- 需要衡量收益波动、尾部风险、最大回撤和风险调整后收益。
- 需要构建投组级风险监控，而不是公司经营分析或企业估值。
- 需要把日收益率序列转换成 Sharpe、Sortino、VaR、CVaR、Max Drawdown 等指标。
- 若问题是公司经营质量、预算偏差或滚动预测，转到 [financial-analyst](../financial-analyst/SKILL.md)。
- 若问题是企业估值模型与假设敏感性，转到 [creating-financial-models](../creating-financial-models/SKILL.md)。

## 核心约束

- `scripts/risk_metrics_calculator.mjs` 使用 Node.js `.mjs` 实现，只依赖本机 Node 运行时。
- CLI 支持单资产、投资组合和滚动风险三类输入，可读取直接 JSON 或聚合字段 `risk_metrics`。
- 输入收益率必须使用小数制，例如 `0.01` 代表 1%，不能混用百分数。
- 年化因子要与数据频率一致；以下示例默认日频、252 个交易日。
- 历史 VaR/CVaR 只描述样本分布，不等于极端行情的完整上界。
- 样本少于 60 条时，脚本会输出 `sample_size_below_60_directional_only` 观察项；不要把短窗口结果当精确风险估计。

## 代码模式

### 模式 1：完整样例

```bash
node scripts/risk_metrics_calculator.mjs assets/risk_metrics_sample.json --format json
```

### 模式 2：只输出投资组合风险

```bash
node scripts/risk_metrics_calculator.mjs assets/risk_metrics_sample.json --section portfolio --format json
```

### 模式 3：直接单资产输入

```json
{
  "returns": [0.012, -0.008, 0.004, -0.021],
  "annualization_factor": 252,
  "risk_free_rate": 0.02,
  "confidence_level": 0.95
}
```

投资组合与滚动风险输入格式见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 收益率是否统一为同一频率、同一计量方式。
- 风险自由利率是否与年化方式一致。
- 组合权重是否和为 1，且各资产收益序列长度完全一致。
- 计算 CVaR 时是否基于同一个 VaR 阈值样本集。
- 做滚动窗口时是否确认窗口长度足以覆盖一个完整风险观察周期。
- 输出出现 `sample_size_below_60_directional_only` 时，是否降低结论强度。
- 需要把风险结论放回企业经营上下文时，是否回到 [financial-analyst](../financial-analyst/SKILL.md) 或 [creating-financial-models](../creating-financial-models/SKILL.md) 联动解释。

## 反模式

### FAIL: 百分数当小数

```json
{ "returns": [1.2, -0.8, 2.1] }
```
```bash
node scripts/risk_metrics_calculator.mjs input.json
# Error: field "returns" must use decimal returns, not percentages
```

### PASS: 统一小数

```json
{ "returns": [0.012, -0.008, 0.021] }
```

### FAIL: 只报 VaR

```
"VaR 95 = 2.1%"
→ 缺 CVaR / 回撤 / 波动率 → 风险画像残缺
```

### PASS: 六指标齐全

```
volatility / var / cvar / max_drawdown / sharpe / sortino
```

### FAIL: 短窗口精确数

```
仅 5 天数据 → 报 "VaR 99 = 3.2%"（无统计意义）
```

### PASS: 样本不足只给方向

```json
{
  "observations": ["sample_size_below_60_directional_only"]
}
```