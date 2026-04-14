---
name: campaign-analytics
description: "在需要分析活动表现、归因模型、漏斗转化率和 ROI/ROAS/CPA 时使用；适合渠道复盘、预算调整和投放诊断。"
metadata:
  version: 1.0.0
---

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
python3 scripts/attribution_analyzer.py assets/sample_campaign_data.json --format json
```

- ROI / ROAS 计算：

```bash
python3 scripts/campaign_roi_calculator.py assets/sample_campaign_data.json --format json
```

- 漏斗瓶颈分析：

```bash
python3 scripts/funnel_analyzer.py assets/sample_campaign_data.json --format json
```

- 结果解释时配合 [attribution-models-guide](references/attribution-models-guide.md)、[campaign-metrics-benchmarks](references/campaign-metrics-benchmarks.md) 和 [funnel-optimization-framework](references/funnel-optimization-framework.md)。

## 检查清单
- 是否说明了数据来源、时间窗、归因窗口和渠道口径。
- 是否把“表现差”拆成流量质量、创意、落地页或转化步骤问题。
- 是否分别给出结论、证据和下一步动作，而不是只贴表格。
- 是否指出哪些结论依赖埋点准确性。

## 反模式
- 用单一 ROAS 指标替代整个投放判断。
- 忽略时间窗和归因模型差异，直接比较不同报表。
- 看到漏斗下降就默认是页面问题，不查流量质量与埋点。
