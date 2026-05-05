# marketing-expert

营销专家能力，覆盖广告创意、SEO、CRO、文案写作、邮件营销、客户研究、用户激活与留存、收入运营、销售赋能、内容策略、落地页、投放、线索增长与数据分析。

## 结构

- `skills/*/SKILL.md`：统一的中文技能说明，按「适用场景→核心约束→代码模式→检查清单→反模式」组织。
- `skills/*/references`、`skills/*/assets`：技能引用资料和示例资产。

## Skills

| Skill | 用途 |
|-------|------|
| `analytics-tracking` | GA4/GTM 埋点规划、审计与排障 |
| `brand-health` | 当用户要做品牌健康度诊断、评估品牌认知-美誉-使用-购买-推荐漏斗、或判断品牌问题出在哪个环节时使用；英文触发词 brand health、brand awareness、brand equity、NPS、brand funnel、brand perception audit。 |
| `content-strategy` | 内容策略、选题、栏目规划、内容日历，含域名方向发散 |
| `copywriting` | 营销页面文案写作（首页、落地页、定价页、功能页），含社交平台内容安全过滤 |
| `cro-methodology` | 落地页转化审计与实验设计 |
| `customer-lifecycle` | 当用户要做客户价值分层（CLV / 铂金-金-铁-铅）或按生命周期阶段（PLC / 客户 LC）制定差异化营销策略时使用；英文触发词 customer pyramid、CLV tiering、product lifecycle、PLC、lifecycle marketing。 |
| `customer-research` | 客户研究：VOC 分析、评论挖掘、Persona 构建 |
| `douyin-viral-content` | 当用户要创作或优化抖音短视频选题、爆款标题、口播脚本、开头钩子、分镜节奏或带货文案时使用。 |
| `fan-operations` | 当用户要提升小红书粉丝互动、评论运营、私信承接、社群留存、粉丝分层或复购转化时使用。 |
| `lead-channel-optimizer` | 获客渠道优先级与 ROI 评估 |
| `lead-research-assistant` | ICP 对齐的目标客户发现 |
| `marketing-plan` | 市场方案、推广策划案、上市传播计划与阶段活动落地 |
| `paid-ads` | 付费投放结构、预算与优化 |
| `redesign-my-landingpage` | React/Vite/Tailwind 落地页实现 |
| `revops` | 收入运营：线索生命周期、评分、路由、Pipeline 管理 |
| `sales-enablement` | 销售赋能：pitch deck、one-pager、异议处理、demo 脚本 |
| `seo` | 技术 SEO、E-E-A-T 审计、Programmatic SEO 与页面可见性优化 |
| `stp-segmentation` | 当用户要做市场细分、选择目标市场、制定市场定位或回答"该卖给谁"时使用；英文触发词 STP、segmentation、targeting、positioning、market segmentation、target market、positioning statement。 |
| `xiaohongshu-commercial-growth` | 当用户要制定小红书商业增长、店铺转化、蒲公英投放、种草链路、私域承接或变现方案时使用。 |
| `youtube-analysis` | 当用户提供 YouTube 视频链接并要求分析内容、总结字幕、拆解演讲或提炼要点时使用。 |
| `youtube-search` | 当用户要按关键词搜索 YouTube 视频、找教程、找热门视频或列候选清单时使用。 |

## Agents

| Agent | 用途 |
|-------|------|
| `acquisition-strategist` | 端到端获客与转化策略，整合渠道、SEO、内容、CRO、付费、推荐与 analytics 输出可执行获客蓝图（注意：此 agent 原名 `growth-strategist`，与 product-expert 的 `growth-stage-strategist` 区分） |
| `content-marketing-engine` | 当需要端到端规划或执行内容营销策略时使用——覆盖内容策略制定、SEO 优化、多平台文案创作（小红书/抖音/YouTube/公众号）、粉丝运营、短视频脚本与分析、付费投放配合。 |
| `conversion-optimizer` | 网站 / 落地页 / 注册 / 订阅 / onboarding 的转化漏斗诊断与实验设计 |
| `marketing-campaign-orchestrator` | 当需要端到端规划并落地一场营销活动时使用——从市场定位（STP）、用户研究、内容策略、SEO、付费投放到转化优化与效果度量。 |
| `social-growth-planner` | 当需要设计社交媒体增长策略时使用。 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/marketing-expert/tests/*.test.mjs
```
