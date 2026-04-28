# product-expert

产品管理专家插件，覆盖 PRD 撰写、商业模型、竞品分析、用户旅程、定价策略和敏捷迭代。当前版本已补齐自检入口、脚本回归测试，以及统一的中文 `SKILL.md` 结构。

## 目录结构

- `skills/`：59 个产品与战略类技能，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `agents/`：8 个窄向 agent，按问题域预加载相关 skill 输出综合分析。
- `tests/`：覆盖脚本行为与 `SKILL.md` 链接校验。

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
| `3c-strategic-triangle` | 当用户要从顾客、公司、竞争者三角度做战略分析、找差异化定位或评估竞争可持续性时使用；英文触发词 3C analysis、Ohmae 3C、customer-company-competitor、strategic triangle。 |
| `balanced-scorecard` | 当用户要设计绩效评估体系、战略执行监控、KPI 体系搭建或从财务/客户/流程/学习四维度评价企业时使用；英文触发词 balanced scorecard、BSC、KPI framework、strategy map、four perspectives。 |
| `bcg-matrix` | 当用户要做产品组合分析、业务优先级排序、资源分配决策或投资组合管理时使用；英文触发词 BCG matrix、growth-share matrix、portfolio analysis、star/cash cow/dog/question mark。 |
| `blm-model` | 当用户要做战略到执行的全链路诊断、分析业绩差距和机会差距的根因、或用华为/IBM 的战略规划方法论时使用；英文触发词 BLM、Business Leadership Model、strategy to execution、gap analysis、market insight to business design。 |
| `business-iron-triangle` | 当用户要从产品、核心业务职能、市场三维度审视业务定位一致性、或判断商业模式是否自洽时使用；英文触发词 business iron triangle、product-function-market、business definition、Abell's three dimensions。 |
| `greiner-growth-model` | 当用户要诊断企业成长阶段、预判组织危机、判断管理模式是否匹配发展阶段时使用；英文触发词 Greiner growth model、organizational growth stages、leadership crisis、autonomy crisis、growth phases。 |
| `mckinsey-7s` | 当用户要做企业内部诊断、组织变革评估、战略执行对齐检查或找出管理短板时使用；英文触发词 McKinsey 7S、7S framework、organizational alignment、strategy-structure fit。 |
| `org-canvas` | 当用户要系统性设计组织架构、检查组织设计与战略的匹配度、或做组织重组规划时使用；英文触发词 organization canvas、org design、organizational design canvas、structure-strategy alignment。 |
| `raci-matrix` | 当用户要明确项目角色分工、解决职责模糊或推诿、设计审批流程或做组织变革中的责任分配时使用；英文触发词 RACI、RASCI、responsibility matrix、accountability、role clarity。 |
| `s-curve-growth` | 当用户要分析产品或市场的生命阶段、判断增长拐点、规划第二曲线或评估市场饱和度时使用；英文触发词 S-curve、growth curve、second curve、inflection point、market saturation、growth plateau。 |
| `space-matrix` | 当用户要做战略态势评估、判断企业该进攻/防守/竞争/保守、或需要四维度（财务/竞争/环境/产业）综合定位时使用；英文触发词 SPACE matrix、strategic position、aggressive/competitive/conservative/defensive posture。 |
| `strategy-clock` | 当用户要分析定价与差异化的组合策略、评估竞争定位或选择价格-价值平衡点时使用；英文触发词 strategy clock、Bowman's strategy clock、price-value strategy、competitive positioning map。 |
| `talent-management` | 当用户要做人才盘点、设计招聘/培训/绩效/薪酬体系、诊断人才流失问题或规划人才梯队时使用；英文触发词 talent management、hire-develop-deploy-retain、talent pipeline、HR strategy、people management cycle。 |
| `tech-maturity-curve` | 当用户要评估新技术的成熟度、判断技术投资时机、避免追风口或识别技术泡沫时使用；英文触发词 Gartner hype cycle、technology maturity curve、hype cycle、technology adoption、trough of disillusionment。 |
| `value-chain-analysis` | 当用户要分析企业竞争优势来源、识别价值创造环节、优化运营效率或决定外包/自建时使用；英文触发词 value chain、Porter value chain、primary activities、support activities、competitive advantage source。 |
| `weizhus-six-elements` | 当用户要从中国商业环境视角分析商业模式、梳理定位到企业价值的因果逻辑链、或做商业模式创新设计时使用；英文触发词 Wei Zhu model、six elements、business model logic chain、Chinese business model。 |

## Agents

按业务问题域拆分的窄向 agent，每个预加载相关框架 skill 在隔离上下文中输出综合分析报告。

| Agent | 适用场景 | 预加载 skill |
|-------|----------|--------------|
| `competitive-strategist` | 竞争结构、差异化定位与价格-价值策略综合分析 | porters-five-forces, 3c-strategic-triangle, competitive-teardown, blue-ocean-strategy, strategy-clock, pricing-strategy, obviously-awesome, crossing-the-chasm |
| `macro-environment-analyst` | 宏观环境扫描、外部冲击传导与技术趋势评估 | pestel-analysis, swot-analysis, tech-maturity-curve, evaluating-new-technology, scp-analysis（thinking-expert） |
| `org-diagnostician` | 组织能力、执行落地、人才结构与绩效体系诊断 | mckinsey-7s, value-chain-analysis, raci-matrix, talent-management, team-composition-analysis, greiner-growth-model, org-canvas, balanced-scorecard, blm-model |
| `growth-stage-strategist` | 增长阶段判断、增长方向选择与增长飞轮设计 | s-curve-growth, designing-growth-loops, plg-readiness, business-iron-triangle, channel-economics, ansoff-matrix（marketing-expert） |
| `business-model-architect` | 商业模式设计、市场规模估算与单位经济校验 | business-model, weizhus-six-elements, saas-metrics, market-sizing-analysis, business-iron-triangle |
| `problem-decomposer` | 复杂问题拆解、根因诊断、决策推进与改进闭环 | systems-thinking, scoping-cutting, planning-under-uncertainty, running-decision-processes, process-optimization, mckinsey-7-step / fishbone-diagram / five-w-two-h / pdca-cycle（thinking-expert） |
| `delivery-planner` | 端到端产品交付规划，预加载 9 个需求与执行框架 | 见 agent 文件 |
| `startup-advisor` | 端到端创业评估，预加载 10 个商业与融资框架 | 见 agent 文件 |
| `customer-research-lead` | 客户研究 / 用户访谈 / 问卷设计 / ICP 验证 / 旅程梳理，可写盘 | mom-test, customer-research（marketing-expert）, designing-surveys（marketing-expert）, customer-journey-map, idea-validator, startup-icp-definer |
| `pm-delivery-coach` | 敏捷交付教练：user story / Epic 拆解 / 估算校准 / 版本规划 / PM 能力辅导 | agile-product-owner, user-story-patterns, epic-decomposition, estimate-calibrator, version-planner, pm-career-ladder |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/product-expert/tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --check plugins/product-expert/skills/agile-product-owner/scripts/user_story_generator.mjs
node --check plugins/product-expert/skills/competitive-teardown/scripts/competitive_matrix_builder.mjs
node --test plugins/product-expert/tests/*.test.mjs
```
