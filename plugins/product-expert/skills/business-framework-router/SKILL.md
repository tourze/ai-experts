---
name: business-framework-router
description: 当用户描述业务场景、战略问题、市场挑战、竞争困境、组织问题或营销困境，但没有指定具体框架时使用；根据问题类型自动推荐 1-3 个最合适的分析框架并说明使用顺序。触发词包括：分析、诊断、战略、定位、竞争、市场、营销、商业模式、组织、增长策略。
---

# 商业分析框架路由

## 适用场景

当用户描述业务问题但没有指定框架时，用此路由表匹配最合适的 1-3 个框架。

## 路由表

| 问题类型 | 信号词 | 推荐框架（按顺序） | 说明 |
|---------|--------|-------------------|------|
| 宏观环境扫描 | 政策、行业趋势、经济形势 | pestel-analysis -> porters-five-forces | PESTEL 看宏观，五力看行业 |
| 外部冲击影响 | AI 冲击、政策变化、技术革命 | scp-analysis -> swot-analysis | SCP 看传导路径，SWOT 看内外结合 |
| 竞争策略 | 竞品、差异化、护城河 | porters-five-forces -> 3c-strategic-triangle -> competitive-teardown | 五力看结构，3C 找差异化，teardown 做深挖 |
| 内部能力诊断 | 组织问题、执行不力、管理短板 | mckinsey-7s -> value-chain-analysis | 7S 看匹配，价值链看环节 |
| 战略方向选择 | 该进攻还是防守、战略定位 | swot-analysis -> space-matrix | SWOT 做全景，SPACE 定方向 |
| 战略到执行 | 战略落不了地、差距分析 | blm-model -> mckinsey-7s | BLM 看全链路，7S 看组织匹配 |
| 产品/业务组合 | 哪个产品该投该砍、资源分配 | bcg-matrix -> ge-matrix | BCG 快速分类，GE 精细评估 |
| 增长策略 | 下一步往哪增长、市场饱和 | s-curve-growth -> ansoff-matrix | S 曲线判断阶段，安索夫选方向 |
| 定价与竞争定位 | 定价策略、价格-价值 | strategy-clock -> pricing-strategy | 战略钟定方向，定价策略定细节 |
| 技术投资决策 | 新技术、该不该投、风口 | tech-maturity-curve -> evaluating-new-technology | Hype Cycle 定阶段，评估技术做深度 |
| 营销策略制定 | 获客、转化、营销组合 | stp-segmentation -> marketing-mix-4p -> aida-funnel | STP 定人群，4P 定策略，AIDA 定漏斗 |
| 客户管理 | 客户分层、流失、CLV | customer-lifecycle | 同时覆盖价值分层（金字塔）与阶段策略（PLC / 客户 LC） |
| 品牌问题 | 品牌认知、美誉度、NPS | brand-health -> content-strategy | 品牌诊断找问题，内容策略做修复 |
| 商业模式设计 | 商业模式、怎么赚钱 | business-model -> weizhus-six-elements | BMC 做清单，魏朱做因果链 |
| 商业模式校验 | 定位是否自洽 | business-iron-triangle | 快速三角一致性检查 |
| 问题拆解 | 不知道问题在哪、复杂问题 | mckinsey-7-step -> fishbone-diagram | 七步法做结构化，鱼骨图做根因 |
| 组织发展阶段 | 公司长大了管理跟不上 | greiner-growth-model -> org-canvas | Greiner 定阶段，画布做重设计 |
| 职责分工 | 谁负责什么、推诿 | raci-matrix | 直接做 RACI |
| 人才管理 | 招聘、培训、留人、流失 | talent-management -> team-composition-analysis | 选育用留做体系，团队分析定结构 |
| 工作计划 | 做个计划、确认方案 | five-w-two-h | 快速补全七维度 |
| 持续改进 | 流程优化、质量管理 | pdca-cycle -> fishbone-diagram | PDCA 做循环，鱼骨图找原因 |
| 绩效体系 | KPI、战略目标分解 | balanced-scorecard | 四维度战略翻译 |

## 核心约束

1. **匹配原则**：从用户描述中提取关键词，匹配上表最接近的问题类型。不确定时问用户。
2. **推荐数量**：推荐 1-3 个框架，说明使用顺序和每个框架解决什么子问题。
3. **不要全推**：每次最多 3 个，多了用户消化不了。
4. **说明为什么不推某个**：如果用户提到的场景看起来适合某个框架但实际不适合，主动说明。
5. **框架组合逻辑**：先宏观后微观、先外部后内部、先诊断后行动。

## 代码模式

本 skill 是路由框架，不要求执行代码。输出时按“问题类型 → 推荐框架 → 使用顺序 → 不推荐项说明”的结构组织，避免给出超过 3 个选项。

## 检查清单

- [ ] 已识别用户问题类型，而不是只按关键词匹配。
- [ ] 推荐框架不超过 3 个。
- [ ] 每个推荐框架都有使用顺序和适用理由。

## 反模式

### FAIL: 菜单式推荐

列出十几个框架让用户自己选，等于没有完成路由。

### PASS: 先判断再组合

先判断主问题，再给 1-3 个框架和执行顺序。
