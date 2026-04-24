---
name: spec-driven-delivery
description: "当需要把一个改动从需求到可验证交付串起一条明确流程（Specify→Plan→Act→Review→Vault）时使用——用 10 分 spec 门禁、外部 journal 持续记录、3 次失败停下问人、以及高风险显式确认来防止过早进入实现和半途跑偏。"
---

# 需求驱动的可验证交付（SPARV）

## 适用场景

- 有一个不是"改一行"的改动，需要把需求→实现→验证串起来一次走完。
- 会跨多次工具调用、可能跨 session，担心中途遗忘决策或跳过验证。
- 交叉引用：
  - 需求拆到原子任务用 `architecture-expert:task-decomposer`
  - 跨功能方案用 `architecture-expert:feature-dev`
  - 长周期计划用 `architecture-expert:persistent-planning`
  - 完成前验证用 `coding-expert:verification-before-completion`
  - 交付后收尾用 `git-expert:finishing-branch`

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 没有达到 spec 门禁分数之前，不进入 Plan 阶段。
- 没有可验证的验收标准，不进入 Act 阶段。
- 没有新鲜证据，不进入 Vault 阶段（对齐 `verification-before-completion`）。
- 连续 3 次同一任务失败必须停下询问用户，不自行无限重试。
- 识别到高风险（生产/敏感数据/破坏性/计费/安全关键）必须先拿到用户显式确认。

## Iron Law

```
Spec 不达标不计划，计划没落实不执行，执行没验证不收尾
```

## 五阶段

### Phase 1 — Specify（10 分门禁）

五个维度各 0/1/2 分，总分 ≥9 才能进入 Plan。

| 维度 | 2 分 | 1 分 | 0 分 |
|---|---|---|---|
| **Value** 为什么做 | 指标/动机明确、可核对 | 动机含糊但方向对 | 不清楚为何要做 |
| **Scope** 做什么 | MVP 边界清晰 + 不做什么也写了 | 只写了要做什么 | 范围漂浮 |
| **Acceptance** 怎样算完成 | 可测试、可自动化核对 | 人话描述、需复测 | 只有"跑通" |
| **Boundaries** 边界 | 错误/性能/兼容/安全关键边界点名 | 提了但不具体 | 完全没谈 |
| **Risk** 风险 | 识别 + 处理方案 | 识别但无方案 | 没识别 |

任何维度得 0 分 → 在 `.sparv/journal.md` 里显式声明不确定项：
```
UNCERTAIN: <什么不确定> | ASSUMPTION: <回退假设>
```
或者给用户 2-3 个选项让其挑。

**出口条件**：分数 ≥9 且写下一句"完成承诺"（可验证的完成陈述，例如"所有 checkout 测试绿 + 手动触发一次支付成功"）。

### Phase 2 — Plan

- 拆成 2-5 分钟粒度的原子任务，每条有可验证的输出或测试点。
- 标注依赖关系（谁必须先做）和验证命令（`npm test`、`cargo test`、`pytest tests/xxx` 等）。
- 计划写到 `.sparv/journal.md` 的 `## Plan` 段。

**Quick 模式豁免**：若同时满足 (a) spec 分数 ≥9、(b) 影响文件 ≤3、(c) 无高风险，可跳过 Plan，直接进入 Act —— 但仍需在 journal 写一行完成承诺，且 Review 阶段不能跳。

### Phase 3 — Act

- 按 Plan 顺序执行，每个原子任务结束立刻跑其验证命令。
- **每 2 次工具调用在 journal 追加一条进度**（格式见下），不等一口气做完。
- 失败处理：
  - 第 1 次：分析失败原因，调整后重试。
  - 第 2 次：换个角度（读相关代码、查文档、补上下文）后重试。
  - 第 3 次：**停下**，把失败现象+已尝试写进 journal，回去问用户。

### Phase 4 — Review

对照 Phase 1 的"完成承诺"和 Phase 2 的计划逐条核对：
- 所有验收标准是否都有新鲜证据支撑？（对齐 `verification-before-completion`）
- 是否产生了 Plan 之外的"顺手改动"？如果有，要么回退，要么显式记录理由。
- 是否引入了回归？至少跑一次完整测试套件。

审查失败 → 回 Phase 3 修复，不跳到 Vault。

### Phase 5 — Vault

把**可复用的东西**归档到 `.sparv/kb.md`，而不是只改完就走人：
- **Patterns**：这次发现的可复用代码模式。
- **Decisions**：关键架构选择 + 当时的理由。
- **Gotchas**：踩的坑和解法。

会话结束或 PR 合并前，归档一次。下次再来时 Phase 1 可以先翻 `kb.md`。

## 外部记忆约定

这个 skill 不依赖任何 hook，journal 就是你跨 session 的记忆。开工时在项目根创建：

```
.sparv/
├── state.yaml      # 当前状态：session_id、current_phase、action_count、consecutive_failures
├── journal.md      # 一切事件的追加日志（Plan/Progress/Findings 全在这）
└── kb.md           # 累积的模式/决策/陷阱（Vault 阶段写入）
```

### state.yaml 最小字段

```yaml
session_id: 2026-04-24-feature-xyz
current_phase: plan           # specify|plan|act|review|vault
action_count: 6               # 每 2 次触发一次 journal 追加
consecutive_failures: 0       # 到 3 必须停下
completion_promise: "checkout 全部测试绿 + 一次支付端到端成功"
```

### journal.md 条目格式

```markdown
## 2026-04-24T10:12:03Z — [phase:act] progress
已完成 src/checkout/payment.ts 的 stripe token 刷新逻辑；
`npm test -- --testPathPattern=checkout` 34/34 pass；
下一步：补 webhook 重放幂等。
```

## 高风险（EHRB）显式确认

触发以下任一信号，**必须在进入 Act 之前拿到用户的显式 "yes"**，并把确认记录到 journal：

- 生产环境或生产数据
- 敏感数据（凭证、PII、token）
- 破坏性操作（删除、truncate、force push、drop）
- 计费 API 或有费用的外部调用
- 安全关键路径（认证、授权、加密、沙箱）

## 检查清单（阶段门禁）

**Specify → Plan**
- [ ] 五维总分 ≥9
- [ ] 所有 0 分维度已写 UNCERTAIN/ASSUMPTION
- [ ] journal 里有一句"完成承诺"
- [ ] 若高风险，已拿到显式确认

**Plan → Act**（Quick 模式可跳 Plan，但仍需满足 bullet 3）
- [ ] 任务拆到 2-5 分钟粒度
- [ ] 每个任务有验证命令
- [ ] 依赖关系和顺序明确

**Act → Review**
- [ ] 所有原子任务的验证命令全部新鲜运行过
- [ ] 没有跳过失败重试规则
- [ ] 每 2 次工具调用都有 journal 追加

**Review → Vault**
- [ ] 对照"完成承诺"逐条核对过
- [ ] 全量测试跑过一次（非子集）
- [ ] Plan 之外的改动已记录或已回退

**Vault 出口**
- [ ] 至少一条 Pattern/Decision/Gotcha 写入 `.sparv/kb.md`
- [ ] state.yaml 的 current_phase 置为 vault 并保留给下次参考

## Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|---|---|
| "需求大概懂了，先写代码" | Spec 没过门禁，大概率返工 |
| "这任务太小，跳过 Plan 吧" | 检查 Quick 模式三个条件，都满足才行 |
| "journal 等做完一起补" | 做完一起补 = 记不清 = 失效 |
| "再试一次就好" | 数一下：是不是第 3 次了？ |
| "高风险但我很确定没事" | EHRB 规则没有"除非" |
| "顺手改了点别的" | 要么回退要么写进 journal |
| "Review 就是走形式" | Review 不通过不能 Vault |

## 适用范围

任何不是一行字就能改完的工作。小改动可走 Quick 模式（Specify→Act→Review），仍走五阶段心智模型。
