---
name: session-reflection
description: 当用户要复盘或收尾当前会话、总结已完成/未完成/验证/风险，或把经验沉淀到 MEMORY/工作流/Skill/Hooks 治理建议时使用；触发词：复盘本轮、总结会话、会话收尾、session reflection、wrap up this session。subagent 不使用。
---

# Session Reflection

收尾当前会话：先压缩真实完成情况，再判断是否沉淀到 4 类长期资产：
`MEMORY.md` / 可复用工作流 / Skill 优化 / Hooks 使用。

## 何时使用

- 任务已闭合（`✅ DONE` / `⚠️ DONE_WITH_CONCERNS`）或对话即将结束。
- 用户说「总结会话 / 会话总结 / 收尾 / 会话收尾 / 结束会话 / 总结本次会话 / wrap up this session」。
- 用户说「复盘 / session reflection / 给点优化建议 / 记忆、工作流、Skill、Hooks 优化建议」。
- 出现「早知道就……」信号：反复修同类 bug、用错 skill、hook 噪声大、记忆缺口明显。
- **不直接处理**：hook 报错 / SKILL 脚本失败 / dispatch 异常等 runtime 故障 → 先用 `trigger-telemetry-advisor` 看 hook telemetry 归因，再决定是否需要复盘层面的治理改动。

## 何时不使用

- 任务仍在推进且用户不是要阶段性 handoff。
- 用户要同日多会话 / 多项目日报、纯 commit 总结或调研纪要。
- 短会话（< 3 轮有效编码交互）只给简短收尾，不输出长期资产建议。
- 自己作为 subagent 被派遣（看到 `<SUBAGENT-STOP>` 即跳过）。

## 模式选择

- `closeout`：只要当前会话总结。
- `reflection`：只要长期资产建议。
- `combined`：范围未限定，或来自固定「下一步推荐」；先收尾，再给精简复盘。

## 工作流

1. **确认范围**：默认当前会话；只有范围、handoff 文件或 commit 建议不清时才问。
2. **收集证据**：优先当前对话；代码仓库补 `git status --short`、`git diff --stat`、`git log --oneline -n 10`。拿不到就明说。
3. **压缩事实**：按工作流 / 主题写已完成、关键决策、涉及文件 / 模块、已验证 / 未验证；禁止时间流水账。
4. **抽取后续**：列经验、风险、未完成项、阻塞依赖与下一步。
5. **筛治理项**：只把跨会话仍成立的观察归入 `memory` / `workflow` / `skill` / `hook`；其余进「不沉淀清单」。
6. **去重并量化**：对照 `MEMORY.md` 与实际 `SKILL.md`；记忆 ≤ 5、工作流 ≤ 2、skill ≤ 3、hook ≤ 2；每条说明收益。
7. **输出闭环**：按 [references/output-contract.md](references/output-contract.md) 输出；可给 commit message 方向，但不自动 commit。

## 报告输出

详见 [references/output-contract.md](references/output-contract.md)。所有模式都必须如实写已验证 / 未验证，禁止伪造完成、验证或可提交状态。

## 治理建议硬规则

- 记忆：用绝对日期；`feedback` / `project` 类带 **Why** 和 **How to apply**；不写当前 PR 状态、代码风格、文件路径或 git 历史。
- Skill：给 `SKILL.md` 路径与 frontmatter `description` 的具体改法，包含增删触发词、典型 prompt 和何时不使用。
- Hook：注明事件、匹配条件和误判样本；禁止建议「全局始终注入」。

## 反模式（NEVER）

详见 [references/anti-patterns.md](references/anti-patterns.md)：
时间流水账、git diff 当复盘、写「下次注意」无规则、伪造验证、写当前 PR 编号、≥ 5 条记忆、subagent 内调用、不读现有 MEMORY 就建议新增、只夸不批。

## 调用示例

`请用 /session-reflection 复盘本轮会话`

完成后由用户决定哪几条落地。本 skill 默认不主动改 MEMORY.md / hooks / skill 文件；若用户明确要求写文件，先总结建议，再按用户授权执行。
