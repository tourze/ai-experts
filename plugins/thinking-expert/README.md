# thinking-expert

思维专家能力，覆盖思考陪跑、优先级判断、第一性原理、逆向推演、多视角审议、跨领域迁移和科研脑暴。

## 目录结构

- `skills/`：17 个思维类技能，每个 `SKILL.md` 使用统一中文结构。
- `tests/`：工具语法与文档结构校验。

## Skills

| Skill | 用途 |
|-------|------|
| `consciousness-council` | 多视角 Mind Council 审议 |
| `cross-pollination-engine` | 跨行业创意移植 |
| `evidence-quality-framework` | 当代码审查、安全审计、事故复盘或研究分析需要三态标注（事实/推断/假设）+ 发现绑定（文件:行 / log / commit / metric）时使用。合并了原 fact-vs-inference-vs-assumption 与 finding-evidence-binding。 |
| `first-principles-decomposer` | 第一性原理分解与重建 |
| `fishbone-diagram` | 当用户要做根因分析、系统性罗列问题的所有可能原因、或用因果分析法排查复杂问题时使用；英文触发词 fishbone diagram、Ishikawa diagram、cause and effect、root cause analysis、5 Whys、herringbone。 |
| `grill-me` | 追问到底（计划/设计的压力测试） |
| `mckinsey-7-step` | 当用户要系统性解决复杂业务问题、用结构化方法从问题定义到方案输出、或做咨询式分析时使用；英文触发词 McKinsey 7 steps、problem solving framework、structured problem solving、hypothesis-driven、issue tree。 |
| `pdca-cycle` | 当用户要做持续改进、质量管理、运营优化或需要闭环问题解决方法时使用；英文触发词 PDCA、Plan-Do-Check-Act、Deming cycle、continuous improvement、kaizen、quality management。 |
| `priority-judge` | 优先级判断（待办排序与行动决策） |
| `scientific-brainstorming` | 科学研究创意与探索 |
| `scp-analysis` | 当用户要分析外部冲击对行业和企业的传导影响、评估政策/技术/市场变化的连锁效应时使用；英文触发词 SCP model、structure-conduct-performance、industry shock analysis、external impact、cascading effect。 |
| `thinking-partner` | 思考拍档（从混沌中理清局面） |
| `what-if-oracle` | 多分支 What-If 情景推演 |

## Agents

| Agent | 用途 |
|-------|------|
| `strategic-thinker` | deep multi-perspective strategic thinking — combining first principles, inversion, scenario analysis, cross-industry analogies, and adversarial questioning to produce rigorous analysis on complex decisions |

## 校验

```bash
node --test plugins/thinking-expert/tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。
