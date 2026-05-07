# App Store ASO Briefing Guide

## 输入清单

按任务收集数据，不要求一次性拿齐；缺口必须在输出中标明。

### 关键词研究

- App 名称、类别、目标用户和核心场景。
- 关键功能、差异化价值和用户会搜索的自然语言词。
- 目标市场、语言、平台和候选竞品。
- 已有关键词排名或搜索数据来源；没有时只能输出采集计划和假设。

### 元数据优化

- 平台：Apple App Store、Google Play 或两者。
- 当前标题、副标题 / 短描述、长描述、关键词字段和促销文本。
- 优先关键词、必须保留的品牌词、禁用词和合规限制。
- 目标动作：提高搜索曝光、提高转化、准备首发或更新版本。

### 竞品、评分与评论

- 竞品名称、平台链接或应用 ID。
- 当前评分、评分量、近期评分变化和评论样本。
- 需要关注的维度：关键词、视觉资产、评价痛点、定价、订阅或功能定位。

### A/B 测试

- 测试对象：图标、截图、标题、副标题、描述或视频。
- Control 与 variant 的差异；一次只测一个主变量。
- 基线转化率、每日流量、目标提升幅度、最小运行周期和停止条件。

### 本地化与上线

- 当前市场、目标市场、预算级别和本地化深度。
- 需要本地化的字段、截图文字、文化禁忌和竞品本地表达。
- 上线日期、审核窗口、素材状态、隐私 / 法务 / 支付合规状态。

## 常见工作流

- 新 App 首发：关键词研究 -> 竞品分析 -> 元数据优化 -> 上线检查 -> 发布时间建议。
- 现有 App 增长：ASO 健康分 -> 缺口排序 -> 元数据优化 -> A/B 测试 -> 评论洞察。
- 国际化扩张：市场优先级 -> 本地关键词 -> 元数据本地化 -> 字符数校验 -> ROI 复盘。
- 版本更新：收集真实改动 -> 过滤用户不可感知提交 -> 按新增 / 优化 / 修复写更新文案。

## 输出结构

每次输出至少包含：

- 任务类型、平台、市场、输入数据来源和不可用数据。
- 建议结果：关键词、元数据、竞品洞察、评论主题、测试方案、上线清单或更新文案。
- 字符数和平台规则校验；Apple 与 Google 分开列。
- 优先级、预期影响、验证方式和下一步数据采集。
- 已调用的 procedure id、关键输入摘要和输出摘要。

## 数据限制

- Apple / Google 不公开完整搜索量，所有搜索量或竞争度必须标明数据来源；没有来源时不要给确定数字。
- 公开竞品数据只能支持外部观察结论，不能推断后台转化率或投放预算。
- 评论分析依赖样本覆盖时间窗，低星评论不是完整需求池。
- Apple 多数字段修改需要重新提审；Google 元数据通常需要等待索引。
- A/B 测试需要足够流量，样本不足时输出试验设计和最小数据门槛。
- 本 skill 不覆盖付费投放、埋点 SDK 接入、商店审核申诉和 App 代码开发。

## 示例 Brief

```json
{
  "request_type": "metadata_optimization",
  "platform": "both",
  "market": "en-US",
  "app": {
    "name": "TaskFlow Pro",
    "category": "Productivity",
    "target_audience": "Professionals who manage team tasks",
    "key_features": ["AI task prioritization", "team collaboration", "calendar integration"],
    "unique_value": "Prioritizes team work from deadlines and context"
  },
  "target_keywords": ["task manager", "productivity app", "team collaboration"],
  "competitors": ["Todoist", "Asana", "Microsoft To Do"],
  "known_metrics": {
    "average_rating": 4.2,
    "conversion_rate": "unknown",
    "keyword_rankings_source": "user export pending"
  }
}
```
