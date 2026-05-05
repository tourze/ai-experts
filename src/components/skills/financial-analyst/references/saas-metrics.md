# SaaS 财务指标速查

## 适用场景
- 准备融资材料、董事会汇报或季度复盘，需要快速查 SaaS 指标定义和公式。
- 评估订阅业务健康度，需要对照行业基准判断好坏。
- 与 [market-sizing-analysis](../market-sizing-analysis/SKILL.md) 配合做市场规模估算，与 [fundraise-advisor](../fundraise-advisor/SKILL.md) 配合准备融资故事。
- 给工程或产品团队解释为什么要关注留存、扩展收入或获客效率。

## 核心约束
- 指标必须给出**公式 + 口径说明**，不允许只丢名词。
- 基准值必须标注来源年份和样本范围（如"B2B SaaS, ARR $1-10M, 2024 OpenView 基准"），不允许凭空给数字。
- 同一分析中 MRR 和 ARR 口径不能混用；选一个口径后全程保持一致。
- 如果用户数据不足以计算某指标，标注 `[数据不足]` 并说明缺什么，不要编造。

## 代码模式

### 核心增长指标

```markdown
| 指标 | 公式 | 含义 | 早期基准 (ARR <$1M) | 规模化基准 (ARR $10M+) |
|---|---|---|---|---|
| MRR | Σ 所有活跃订阅月费 | 月经常性收入 | 看增速而非绝对值 | — |
| ARR | MRR × 12 | 年经常性收入 | — | — |
| MRR 增速 | (本月MRR - 上月MRR) / 上月MRR | 月环比增长 | >15% MoM | >5% MoM |
| Net New MRR | New + Expansion - Contraction - Churn | 净新增 MRR | 正数 | 持续正数 |
```

### 留存与流失

```markdown
| 指标 | 公式 | 含义 | 好 | 优秀 |
|---|---|---|---|---|
| Gross Revenue Retention | (期初MRR - Churn - Contraction) / 期初MRR | 不含扩展的留存 | >85% | >95% |
| Net Revenue Retention (NRR) | (期初MRR - Churn - Contraction + Expansion) / 期初MRR | 含扩展的留存 | >100% | >120% |
| Logo Churn Rate | 流失客户数 / 期初客户数 | 客户流失率 | <5%/月 | <2%/月 |
| Revenue Churn Rate | 流失MRR / 期初MRR | 收入流失率 | <3%/月 | <1%/月 |
```

### 单位经济学

```markdown
| 指标 | 公式 | 含义 | 健康线 |
|---|---|---|---|
| CAC | (销售+市场费用) / 新客户数 | 获客成本 | — |
| LTV | ARPA × 毛利率 / Revenue Churn Rate | 客户终身价值 | — |
| LTV/CAC | LTV / CAC | 获客效率 | >3x |
| CAC Payback | CAC / (ARPA × 毛利率) | 回本月数 | <18个月 |
| Magic Number | Net New ARR / 上季度销售市场费用 | 获客效率 (增长视角) | >0.75 |
```

### 效率指标

```markdown
| 指标 | 公式 | 含义 | 基准 |
|---|---|---|---|
| Rule of 40 | 收入增速% + 利润率% | 增长与盈利平衡 | ≥40% |
| Burn Multiple | Net Burn / Net New ARR | 每 $1 ARR 烧多少钱 | <2x |
| ARR per Employee | ARR / 全职人数 | 人效 | >$100K (早期), >$200K (规模化) |
| Gross Margin | (收入 - COGS) / 收入 | 毛利率 | >70% |
```

## 检查清单
- [ ] 所有指标给出了公式和口径，没有只丢名词。
- [ ] MRR/ARR 口径全程统一，没有混用。
- [ ] 基准值标注了来源、年份和适用范围。
- [ ] 对异常值或缺失数据有明确说明。

## 反模式

### FAIL: MRR 和 ARR 混算

```
"MRR $100K, ARR $1.5M"
→ 100K × 12 = 1.2M ≠ 1.5M
→ 有人偷偷把一次性收入算进 ARR
→ 投资人发现口径不一致 → 信任崩塌
```

### PASS: 口径一致 + 拆分说明

```
MRR $100K（仅订阅收入）
├─ New MRR: $15K
├─ Expansion: $8K
├─ Contraction: -$3K
├─ Churn: -$5K
└─ Net New MRR: $15K
ARR = $100K × 12 = $1.2M
注：专业服务收入 $25K/月 不计入 ARR
```

### FAIL: LTV/CAC 造数

```
LTV = ARPA × 60 个月（"我觉得客户能用 5 年"）
CAC = 只算广告费，不算销售工资
→ LTV/CAC = 20x → "我们效率极高"
→ 实际 Logo Churn 8%/月 → 平均生命周期 12 个月
```

### PASS: 用实际流失率推导

```
月 Revenue Churn Rate = 3%
平均客户生命周期 = 1/0.03 ≈ 33 个月
ARPA = $500/月, 毛利率 75%
LTV = $500 × 0.75 / 0.03 = $12,500
CAC = $4,000（含销售薪资、工具、广告）
LTV/CAC = 3.1x → 刚过健康线，需优化留存或降 CAC
```