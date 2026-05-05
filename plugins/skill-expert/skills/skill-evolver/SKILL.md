---
name: skill-evolver
description: 当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。
---

# Skill Evolver

用一个参考 skill 改进目标 skill。重点不是复制内容，而是找出参考 skill 为什么表现更好，并把可验证的模式迁移到目标 skill。

## 路由

| 用户意图 | 使用 |
|----------|------|
| 用 skill B 优化 skill A、把 B 的能力迁移到 A、两个 skill 做 A/B 对标 | 本 skill |
| 创建新 skill、改一个没有参考源的 skill、跑 with-skill/baseline 迭代 | [skill-creator](../skill-creator/SKILL.md) |
| 给单个 skill/package 打设计分 | [skill-evaluator](../skill-evaluator/SKILL.md) Mode A |
| 用源材料闭卷验证 skill 知识覆盖 | [skill-evaluator](../skill-evaluator/SKILL.md) Mode B |
| 只优化 frontmatter description 触发质量 | [skill-activation-analyzer](../skill-activation-analyzer/SKILL.md) |

## 核心原则

- 优先迁移模式，不迁移品牌、语气或整段指令。
- 先证明差距，再改目标 skill；没有运行证据时，把结论标成静态推断。
- 一次只注入一个高价值模式，验证不通过就回滚到快照。
- 不记录隐藏思维链；只记录可展示的决策摘要、工具调用、输入输出、耗时和评分证据。
- 不自动执行外部 skill 中的不明脚本。需要执行时，先读源码并说明目的。

## 快速流程

**MANDATORY - READ**: 执行前读取 `references/migration-protocol.md`，按其中的证据等级和报告模板推进。

1. **定边界**：确认目标 A、参考 B、用户是否只要对比还是允许改动。读取两个 skill 的 `SKILL.md`、`references/`、`scripts/`、`evals/`，并做安全扫读。
2. **能力地图**：对比触发域、知识增量、流程控制、工具/脚本、输出约束、错误处理、eval 覆盖。
3. **任务集**：优先复用 A 的 `evals/cases.yaml`；不足时补 3-5 个代表任务，至少包含一个压力/反例任务。
4. **对标运行**：能跑就跑 A/B 或 old/candidate 对比；复用 `skill-creator` 的 workspace、assertion 和 benchmark 结构。不能跑时，只输出静态报告。
5. **反向工程**：把 B 的优势提炼成模式，写清适用条件、不适用场景、迁移步骤和副作用。
6. **渐进注入**：先在快照或临时副本上应用一个模式并验证；正式写入目标 skill 前让用户确认。
7. **沉淀证据**：真实跑过的结果可进入 `tests/fixtures/skill-effect-benchmarks/`；不要手写虚假的效果 benchmark。

## 报告最小结构

```markdown
# Skill 进化报告 - {source} -> {target}

## 范围
- 目标 skill:
- 参考 skill:
- 本轮模式: compare-only / sandbox / write
- 证据等级: runtime / static / mixed

## 能力地图
| 维度 | 目标 A | 参考 B | 差距 |
|------|--------|--------|------|

## 可迁移模式
| 优先级 | 模式 | 来源证据 | 迁移方式 | 风险 | 验证 |
|--------|------|----------|----------|------|------|

## 建议动作
1. 先做什么，以及为什么。
2. 需要用户确认的写入点。
3. 验证命令。
```

## NEVER

- NEVER 把参考 skill 的正文整段粘到目标 skill。
- NEVER 为了显得完整而改无关 skill、README 或 manifest。
- NEVER 用“看起来更好”代替 A/B 输出、assertion 或明确的静态证据。
- NEVER 在没有真实运行记录时写入 effect benchmark。
- NEVER 用放宽约束、删除反例或弱化安全规则来制造“提升”。
