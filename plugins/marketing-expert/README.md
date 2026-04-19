# marketing-expert

营销专家插件，覆盖广告创意、SEO、CRO、内容策略、落地页、投放、线索增长与数据分析。

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
| `competitive-ads-extractor` | 竞品广告素材与信息提炼 |
| `competitor-alternatives` | 竞品对比页与替代页内容架构 |
| `content-humanizer` | AI 文案人性化改写 |
| `content-repurpose` | 一篇内容多平台分发（LinkedIn/Medium/Reddit/Quora） |
| `content-strategy` | 内容策略、选题、栏目规划与内容日历 |
| `copy-editing` | 营销文案编辑与质量把关 |
| `cro-methodology` | 落地页转化审计与实验设计 |
| `domain-name-brainstormer` | 域名方向发散与筛选 |
| `influence-psychology` | 说服原则在营销中的应用 |
| `lead-channel-optimizer` | 获客渠道优先级与 ROI 评估 |
| `lead-research-assistant` | ICP 对齐的目标客户发现 |
| `leads-researcher` | 线索、公司与 buyer intent 调研 |
| `made-to-stick` | SUCCESs 粘性表达框架 |
| `marketing-psychology` | 行为科学与决策心理学应用 |
| `paid-ads` | 付费投放结构、预算与优化 |
| `popup-cro` | 弹窗、模态框、通知条优化 |
| `redesign-my-landingpage` | React/Vite/Tailwind 落地页实现 |
| `referral-program` | 推荐、联盟与口碑增长机制 |
| `seo` | 技术 SEO、E-E-A-T 审计、Programmatic SEO 与页面可见性优化 |
| `seo-content-scoring` | SEO 内容 5 维度质量评分与发布门控 |
| `site-architecture` | 网站信息架构与导航规划 |
| `topic-cluster` | 主题聚类策略（pillar + supporting articles + 内链拓扑） |

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
python3 -m py_compile $(find plugins/marketing-expert/skills -path '*/scripts/*.py' | sort)
```
