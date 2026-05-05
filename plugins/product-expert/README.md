# product-expert

产品管理专家能力，覆盖 PRD 撰写、商业模型、竞品分析、用户旅程、定价策略和敏捷迭代。当前版本已补齐自检入口、回归测试，以及统一的中文 `SKILL.md` 结构。

## 目录结构

- `skills/`：58 个产品与战略类技能，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `agents/`：6 个窄向 agent，按问题域预加载相关 skill 输出综合分析。
- `tests/`：覆盖工具行为与 `SKILL.md` 链接校验。

## Skills

| Skill | 用途 |
|-------|------|
| `agile-product-owner` | 敏捷产品负责人（Backlog/Sprint） |
| `bcg-matrix` | 当用户要做产品组合分析、业务优先级排序、资源分配决策或投资组合管理时使用；英文触发词 BCG matrix、growth-share matrix、portfolio analysis、star/cash cow/dog/question mark。 |
| `business-health-diagnostic` | 业务健康度诊断记分卡 |
| `business-model` | 商业模型画布（9 大模块） |
| `competitive-intelligence` | 竞品情报：单一竞品拆解到多框架交叉验证的全谱分析 |
| `create-prd` | 8 段式 PRD 文档撰写 |
| `customer-journey-map` | 端到端用户旅程地图 |
| `designing-growth-loops` | 增长飞轮设计与优化 |
| `estimate-calibrator` | 三点估算校准（最佳/最可能/最差） |
| `evaluating-new-technology` | 新技术评估方法论 |
| `financial-analyst` | 当需要做财报比率分析、DCF 估值、预算偏差或滚动预测时使用。 |
| `fundraise-advisor` | 融资策略与 Deck 准备 |
| `funnel-architect` | 销售漏斗与价值阶梯设计 |
| `legal-risk-assessment` | 当需要评估合同、合规、劳动或争议事项的法律风险时使用。 |
| `market-sizing-analysis` | TAM/SAM/SOM 市场规模估算 |
| `meeting-insights-analyzer` | 当需要基于会议转写做沟通行为复盘、发言占比、打断频率、引导风格或跨会议趋势分析时使用。 |
| `opportunity-solution-tree` | 机会解决方案树 |
| `org-canvas` | 当用户要系统性设计组织架构、检查组织设计与战略的匹配度、或做组织重组规划时使用；英文触发词 organization canvas、org design、organizational design canvas、structure-strategy alignment。 |
| `pestel-analysis` | PESTEL 宏观环境分析 |
| `planning-under-uncertainty` | 不确定性下的产品规划 |
| `porters-five-forces` | 波特五力分析 |
| `prfaq` | 亚马逊式新闻稿 + FAQ（Working Backwards） |
| `pricing-strategy` | 定价策略与打包方案 |
| `process-optimization` | 业务流程分析与优化 |
| `product-design-critic` | 产品设计判断力（UI/UX/交互/任务驱动） |
| `raci-matrix` | 当用户要明确项目角色分工、解决职责模糊或推诿、设计审批流程或做组织变革中的责任分配时使用；英文触发词 RACI、RASCI、responsibility matrix、accountability、role clarity。 |
| `running-decision-processes` | 高质量决策流程 |
| `startup-icp-definer` | 理想客户画像定义 |
| `startup-viability-checklist` | 当需要快速评估创业项目整体可行性时使用；覆盖想法验证、ICP、市场、模型、定价、渠道、融资、团队等维度的结构化检查清单。 |
| `structured-business-analysis-framework` | 当需要把开放式商业问题转成结构化分析时使用：从 5W2H 问题界定、MECE 假设树、证据分层（事实/推断/假设）、按问题类型选择分析模型，到设计最小验证计划与可执行建议。 |
| `structured-problem-decomposition` | 当需要把复杂模糊问题系统性拆解为可执行步骤时使用——六阶段编排流程（问题界定→结构化拆解→根因分析→系统动态→决策推进→PDCA 闭环），提供各阶段过渡标准与红旗信号 |
| `swot-analysis` | SWOT 分析 |
| `systems-thinking` | 系统思维与复杂动态分析 |

## Agents

| Agent | 用途 |
|-------|------|
| `business-analyst` | 开放式商业问题分析，串联问题界定、假设树、数据验证、模型选择与行动建议 |
| `competitive-strategist` | 竞争结构、差异化定位与价格-价值策略综合分析 |
| `pm-delivery-coach` | 敏捷交付教练：user story / Epic 拆解 / 估算校准 / 版本规划 / PM 能力辅导 |
| `problem-decomposer` | 复杂问题拆解、根因诊断、决策推进与改进闭环 |
| `product-discoverer` | 当需要做产品发现与验证时使用——覆盖机会识别、用户验证、PRD 撰写、增长飞轮设计、技术评估和组织对齐。可以在用户指定目录下创建产品文档。 |
| `startup-advisor` | 端到端创业评估，预加载 10 个商业与融资框架 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/product-expert/tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/product-expert/tests/*.test.mjs
```
