# marketing-expert

营销专家插件，覆盖广告创意、SEO、CRO、文案写作、邮件营销、客户研究、用户激活与留存、收入运营、销售赋能、内容策略、落地页、投放、线索增长与数据分析。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/*/SKILL.md`：统一的中文技能说明，按「适用场景→核心约束→代码模式→检查清单→反模式」组织。
- `skills/*/references`、`skills/*/scripts`、`skills/*/assets`：技能引用资料、可执行脚本和示例资产。

## Skills

| Skill | 用途 |
|-------|------|
| `ad-creative` | 广告创意批量生成与迭代 |
| `aeo-geo` | 答案引擎优化（AEO）与生成引擎优化（GEO），让内容被 AI 搜索引用 |
| `analytics-tracking` | GA4/GTM 埋点规划、审计与排障 |
| `campaign-analytics` | 归因、漏斗和 ROI 分析 |
| `churn-prevention` | 流失预防：取消流设计、动态挽留、dunning 支付恢复 |
| `cold-email` | B2B 冷邮件与跟进序列写作 |
| `competitive-ads-extractor` | 竞品广告素材与信息提炼 |
| `competitor-alternatives` | 竞品对比页与替代页内容架构 |
| `content-humanizer` | AI 文案人性化改写 |
| `content-repurpose` | 一篇内容多平台分发（LinkedIn/Medium/Reddit/Quora） |
| `content-strategy` | 内容策略、选题、栏目规划与内容日历 |
| `copy-editing` | 营销文案编辑与质量把关 |
| `copywriting` | 营销页面文案写作（首页、落地页、定价页、功能页） |
| `cro-methodology` | 落地页转化审计与实验设计 |
| `customer-research` | 客户研究：VOC 分析、评论挖掘、Persona 构建 |
| `domain-name-brainstormer` | 域名方向发散与筛选 |
| `email-sequence` | 邮件序列设计：欢迎、nurture、re-engagement、onboarding |
| `influence-psychology` | 说服原则在营销中的应用 |
| `lead-channel-optimizer` | 获客渠道优先级与 ROI 评估 |
| `lead-research-assistant` | ICP 对齐的目标客户发现 |
| `leads-researcher` | 线索、公司与 buyer intent 调研 |
| `made-to-stick` | SUCCESs 粘性表达框架 |
| `marketing-psychology` | 行为科学与决策心理学应用 |
| `onboarding-cro` | 注册后引导与用户激活优化 |
| `page-cro` | 页面级转化率优化（CRO 分析框架） |
| `paid-ads` | 付费投放结构、预算与优化 |
| `popup-cro` | 弹窗、模态框、通知条优化 |
| `redesign-my-landingpage` | React/Vite/Tailwind 落地页实现 |
| `referral-program` | 推荐、联盟与口碑增长机制 |
| `revops` | 收入运营：线索生命周期、评分、路由、Pipeline 管理 |
| `sales-enablement` | 销售赋能：pitch deck、one-pager、异议处理、demo 脚本 |
| `seo` | 技术 SEO、E-E-A-T 审计、Programmatic SEO 与页面可见性优化 |
| `seo-content-scoring` | SEO 内容 5 维度质量评分与发布门控 |
| `signup-flow-cro` | 注册流程转化优化 |
| `site-architecture` | 网站信息架构与导航规划 |
| `topic-cluster` | 主题聚类策略（pillar + supporting articles + 内链拓扑） |
| `aida-funnel` | 当用户要设计客户认知-兴趣-欲望-行动的转化路径、分析营销漏斗各阶段效率、或优化从曝光到购买的全链路时使用；英文触发词 AIDA、AIDMA、awareness-interest-desire-action、marketing funnel stages、conversion funnel。 |
| `ansoff-matrix` | 当用户要制定增长策略、评估市场渗透/产品开发/市场开发/多元化的风险收益、或回答"下一步往哪里增长"时使用；英文触发词 Ansoff matrix、growth strategy、market penetration、product development、market development、diversification。 |
| `brand-health` | 当用户要做品牌健康度诊断、评估品牌认知-美誉-使用-购买-推荐漏斗、或判断品牌问题出在哪个环节时使用；英文触发词 brand health、brand awareness、brand equity、NPS、brand funnel、brand perception audit。 |
| `customer-pyramid` | 当用户要做客户分层管理、设计差异化服务策略、优化客户生命周期价值或诊断客户结构健康度时使用；英文触发词 customer pyramid、customer segmentation by value、CLV tiering、platinum-gold-iron-lead、customer profitability。 |
| `marketing-mix-4p` | 当用户要制定营销组合策略、审查产品/价格/渠道/促销的配合度、或用 4P/4C/4R 框架做营销诊断时使用；英文触发词 4P、4C、4R、marketing mix、product-price-place-promotion、marketing strategy audit。 |
| `product-lifecycle` | 当用户要分析产品或客户的生命周期阶段、制定各阶段差异化营销策略、或规划生命周期管理体系时使用；英文触发词 product lifecycle、PLC、customer lifecycle、introduction-growth-maturity-decline、lifecycle marketing。 |
| `stp-segmentation` | 当用户要做市场细分、选择目标市场、制定市场定位或回答"该卖给谁"时使用；英文触发词 STP、segmentation、targeting、positioning、market segmentation、target market、positioning statement。 |

## Agents

| Agent | 用途 |
|-------|------|
| `content-producer` | create, optimize, and polish marketing content — from strategy through finished copy |
| `growth-strategist` | build end-to-end growth strategies that combine acquisition channels, SEO, content planning, conversion optimization, and analytics into a unified growth plan |

## 安装

```bash
claude --plugin-dir /path/to/plugins/marketing-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install marketing-expert@ai-experts
claude plugin install marketing-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall marketing-expert
claude plugin uninstall marketing-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
claude plugin validate plugins/marketing-expert
jq empty plugins/marketing-expert/.claude-plugin/plugin.json
jq empty plugins/marketing-expert/hooks/hooks.json
node --check plugins/marketing-expert/hooks/dispatch.mjs
node --check plugins/marketing-expert/skills/copy-editing/scripts/readability_scorer.mjs
node --check plugins/marketing-expert/skills/competitor-alternatives/scripts/comparison_matrix_builder.mjs
node --check plugins/marketing-expert/skills/campaign-analytics/scripts/attribution_analyzer.mjs
node --check plugins/marketing-expert/skills/campaign-analytics/scripts/campaign_roi_calculator.mjs
node --check plugins/marketing-expert/skills/campaign-analytics/scripts/funnel_analyzer.mjs
python3 -m py_compile $(find plugins/marketing-expert/skills -path '*/scripts/*.py' | sort)
```
