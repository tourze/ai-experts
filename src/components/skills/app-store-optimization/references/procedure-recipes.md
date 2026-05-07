# App Store ASO Procedure 路由指南

## 元数据优化

使用 `app-store-optimization-metadata-optimizer`：

- 输入平台、应用名称、类别、目标用户、核心功能、差异化价值和目标关键词。
- 输出标题、副标题、短描述、长描述或关键词字段建议。
- 必须按 Apple / Google 字段限制做字符数校验。

## ASO 健康分

使用 `app-store-optimization-aso-scorer`：

- 输入元数据质量、评分评论、关键词排名和转化率。
- 输出整体分、薄弱环节、优先级和下一步动作。
- 缺少真实排名或转化率时，先标注数据缺口，不估算成确定分数。

## 评论、竞品与本地化

- 评论洞察：`app-store-optimization-review-analyzer`。
- 竞品对标：`app-store-optimization-competitor-analyzer`。
- 本地化规划：`app-store-optimization-localization-helper`。

输出时分别区分：

- 用户真实痛点 vs 低星噪声。
- 竞品可借鉴策略 vs 不适合本产品的定位。
- 语言翻译问题 vs 市场搜索行为差异。

## A/B 测试与上线检查

- A/B 测试计划：`app-store-optimization-ab-test-planner`。
- 上线检查：`app-store-optimization-launch-checklist`。

测试计划至少包含：

- 单一变量。
- 基线转化率。
- 样本量或最小运行时长。
- 成功指标和停止条件。

## 更新文案

使用 `app-store-optimization-collect-release-changes` 收集真实改动，再按 `changelog-guide` 写门店更新文案。

按“新增 / 优化 / 修复”归类，过滤 refactor、chore、CI、内部重命名和用户不可感知改动。
