---
name: revops
description: 当用户要设计收入运营体系、线索生命周期、MQL/SQL、lead scoring、CRM 自动化、线索路由或营销销售交接时使用。
---

# 收入运营体系（revops）

## 适用场景
- 搭建营销、销售、客户成功之间的统一收入引擎
- 定义线索生命周期、MQL/SQL 标准、评分模型和路由规则
- 设计营销-销售交接 SLA 和 CRM 自动化
- 诊断漏斗漏损、交接断裂或数据质量问题

## 核心约束
- **单一事实源**：CRM 为主记录系统，不允许影子 pipeline
- **先定义再自动化**：无业务定义不上自动化
- **衡量每个交接**：营销→SDR→AE→CS 每个交接点有 SLA
- **收入团队对齐**：三方共享指标仪表盘和目标定义

## 线索生命周期
Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist

- MQL 必须同时满足**画像匹配**（ICP fit）和**购买意图**（engagement）
- 单纯下载白皮书不构成 MQL；画像完美但零互动也不构成 MQL

## 线索评分
三类规则缺一不可（详见 [references/scoring-and-pipeline.md](references/scoring-and-pipeline.md)）：
- **显性**（Fit）：公司规模、职级、行业、地域
- **隐性**（Engagement）：定价页访问(高)、案例页(高)、内容下载(中)、邮件点击(低)
- **负分**：竞品域名排除、edu 降分、30 天无活动衰减、退订清零

## MQL→SQL 交接 SLA
- 4 小时内首次联系，48 小时内 qualify/reject 并记录原因
- SDR 退回需注明原因，营销按原因优化评分模型

## 线索路由
- 策略：轮询 / 区域 / 账户 / 技能（详见 references）
- 5 分钟内联系转化概率是 30 分钟后的 21 倍——speed-to-lead 优先于公平
- 必须有兜底逻辑：主负责人未响应 → 备选 → 通知管理者

## Pipeline 管理
Qualified → Discovery → Demo → Proposal → Negotiation → Closed Won/Lost
- 每阶段有客观进入标准，不允许凭感觉推进
- 停留超阶段均值 2 倍自动触发复盘
- 丢单必须记录原因（竞品/预算/时机/无反应）

## CRM 自动化
自动化五件事：生命周期升级、任务创建、SLA 告警、阶段通知、赢输触发（详见 references）。无业务定义的流程不自动化。

## 数据治理
- 邮箱主键去重，新建实时查重 + 季度批量
- 必填字段硬校验：来源、公司、规模、行业
- Enrichment 自动补全并标记来源
- 季度审计：重复率、空值率、过时记录归档

## 核心指标
- Lead→MQL 5-15% | MQL→SQL 30-50% | SQL→Opp 50-70%
- LTV:CAC > 3:1 | Speed-to-lead < 5min | Win rate 20-30%
- Pipeline velocity = 商机数 x 均单价 x 赢率 / 销售周期

## 检查清单
- [ ] MQL 定义包含画像+意图双重门槛
- [ ] 交接 SLA 4h/48h 并有超时升级
- [ ] 评分含显性、隐性、负分三类且有衰减
- [ ] 路由有兜底升级逻辑
- [ ] Pipeline 阶段有客观进入标准
- [ ] 核心指标仪表盘三方可见
- [ ] 季度数据健康审计

## 反模式
- 只看数量不看质量 → MQL 注水，销售不信任
- 交接无 SLA → 线索冷掉
- 评分不衰减 → 旧行为虚高
- 先买工具再定流程 → 自动化放大坏流程
- 影子 Pipeline → 口径不一致
- 丢单不复盘 → 同因反复丢单
