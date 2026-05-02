# 活动分析（campaign-analytics）

## 适用场景
- 评估多渠道活动的 ROI、ROAS、CPA、CPL 和 CAC。
- 对比 first-touch、last-touch、linear、time-decay、position-based 等归因模型。
- 找出漏斗瓶颈、渠道差异和需要优先修复的转化阶段。

## 核心约束
- 输入数据必须是可审计的 JSON；样例以 [sample_campaign_data.json](assets/sample_campaign_data.json) 为准。
- 归因、漏斗、ROI 是三条不同分析线，输出里要明确区分，不混在一句总结里。
- 先确认数据口径和时间窗口，再解释结果；错误口径下的精细图表没有价值。
- 若发现转化事件本身不可靠，先回到 [analytics-tracking](../analytics-tracking/SKILL.md) 修埋点。

## 代码模式
- 归因分析：

```bash
node scripts/attribution_analyzer.mjs assets/sample_campaign_data.json --format json
```

- ROI / ROAS 计算：

```bash
node scripts/campaign_roi_calculator.mjs assets/sample_campaign_data.json --format json
```

- 漏斗瓶颈分析：

```bash
node scripts/funnel_analyzer.mjs assets/sample_campaign_data.json --format json
```

- 结果解释时配合 [attribution-models-guide](references/attribution-models-guide.md)、[campaign-metrics-benchmarks](references/campaign-metrics-benchmarks.md) 和 [funnel-optimization-framework](references/funnel-optimization-framework.md)。

## 检查清单
- 是否说明了数据来源、时间窗、归因窗口和渠道口径。
- 是否把“表现差”拆成流量质量、创意、落地页或转化步骤问题。
- 是否分别给出结论、证据和下一步动作，而不是只贴表格。
- 是否指出哪些结论依赖埋点准确性。

## 反模式

### FAIL: 单一 ROAS

```
"Meta ROAS 3.2，Google ROAS 2.8 → 加大 Meta 预算"
→ Meta 是 last-touch 归因，多数转化已被 SEO 预热
→ 砍 Google 后 Meta ROAS 也跌到 1.5
```

### PASS: 多模型 + 全漏斗

```
| 渠道 | First-touch ROAS | Last-touch ROAS | 漏斗位置 | 建议 |
| Meta | 0.8 | 3.2 | 收割 | 维持 |
| Google Search | 1.2 | 2.8 | 收割 | 维持 |
| SEO/内容 | 4.5 | 0.3 | 引流 | 加大 |
| Display | 0.4 | 0.5 | 暂停 | 砍 |
```

### FAIL: 不同口径混比

```
"GA4 显示转化 100 / Meta Ads 显示转化 80 → Meta 漏 20"
→ GA4 7-day window vs Meta 28-day → 口径不同
→ 错误归因排查方向
```

### PASS: 口径对齐

```
统一：30 天 click + 1 天 view
统一：转化定义 = paid signup（不是注册）
统一：去重规则
→ 跨平台 reconcile 报表，差异 < 5% 才有意义
```