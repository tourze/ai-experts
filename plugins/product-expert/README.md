# product-expert

产品管理专家插件，覆盖 PRD 撰写、商业模型、竞品分析、用户旅程、定价策略和敏捷迭代。当前版本已补齐插件级 hook、自检入口、脚本回归测试，以及统一的中文 `SKILL.md` 结构。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：45 个产品与战略类技能，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `tests/`：覆盖 manifest、dispatch、脚本行为与 `SKILL.md` 链接校验。

## Skills

| Skill | 用途 |
|-------|------|
| `create-prd` | 8 段式 PRD 文档撰写 |
| `agile-product-owner` | 敏捷产品负责人（Backlog/Sprint） |
| `business-model` | 商业模型画布（9 大模块） |
| `competitive-intelligence` | 竞品研究与交互式战斗卡 |
| `competitive-teardown` | 竞品产品拆解分析 |
| `customer-journey-map` | 端到端用户旅程地图 |
| `idea-validator` | 创业想法验证（Hexa 机会备忘录） |
| `market-sizing-analysis` | TAM/SAM/SOM 市场规模估算 |
| `mom-test` | 用户访谈方法论（妈妈测试） |
| `obviously-awesome` | 产品定位方法论 |
| `opportunity-solution-tree` | 机会解决方案树 |
| `crossing-the-chasm` | 技术采用生命周期 |
| `blue-ocean-strategy` | 蓝海战略与价值创新 |
| `porters-five-forces` | 波特五力分析 |
| `pricing-strategy` | 定价策略与打包方案 |
| `planning-under-uncertainty` | 不确定性下的产品规划 |
| `scoping-cutting` | 项目范围界定与功能裁剪 |
| `version-planner` | 渐进式版本规划（MVP 拆解） |
| `product-design-critic` | 产品设计判断力（UI/UX/交互/任务驱动） |
| `product-name` | 产品命名头脑风暴（5 个方案 + 理由） |
| `product-naming` | 产品命名协作流程（灵魂挖掘→竞品验证） |
| `startup-icp-definer` | 理想客户画像定义 |
| `swot-analysis` | SWOT 分析 |
| `systems-thinking` | 系统思维与复杂动态分析 |
| `designing-growth-loops` | 增长飞轮设计与优化 |
| `designing-surveys` | 问卷/NPS/调研设计 |
| `evaluating-new-technology` | 新技术评估方法论 |
| `running-decision-processes` | 高质量决策流程 |
| `pitch-deck-reviewer` | VC 路演 Deck 审查（ABC 框架） |
| `fundraise-advisor` | 融资策略与 Deck 准备 |
| `funnel-architect` | 销售漏斗与价值阶梯设计 |
| `pre-mortem-analyst` | 事前验尸法（假设已失败反推原因） |
| `estimate-calibrator` | 三点估算校准（最佳/最可能/最差） |
| `team-composition-analysis` | 团队结构/招聘/薪酬/股权设计 |
| `process-optimization` | 业务流程分析与优化 |
| `saas-metrics` | SaaS 财务指标速查（MRR/ARR/CAC/LTV/NRR） |
| `plg-readiness` | PLG 成熟度评估与激活框架 |
| `user-story-patterns` | 用户故事编写与 8 种拆分模式 |
| `epic-decomposition` | Epic 分解的 9 种模式 |
| `pestel-analysis` | PESTEL 宏观环境分析 |
| `prfaq` | 亚马逊式新闻稿 + FAQ（Working Backwards） |
| `ai-product-readiness` | AI 产品适用性评估（5 维模型） |
| `pm-career-ladder` | PM 职级能力模型与晋升路径 |
| `business-health-diagnostic` | 业务健康度诊断记分卡 |
| `channel-economics` | 获客渠道经济性分析 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/product-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install product-expert@ai-experts
claude plugin install product-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall product-expert
claude plugin uninstall product-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
jq empty plugins/product-expert/.claude-plugin/plugin.json
jq empty plugins/product-expert/hooks/hooks.json
find plugins/product-expert/hooks plugins/product-expert/tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
python3 -m py_compile \
  plugins/product-expert/skills/agile-product-owner/scripts/user_story_generator.py \
  plugins/product-expert/skills/competitive-teardown/scripts/competitive_matrix_builder.py
node --test plugins/product-expert/tests/*.test.mjs
```
