---
name: session-reflection
description: 当一轮会话即将结束、需要复盘本次合作并把经验沉淀到全局记忆、可复用工作流、Skill 与 Hooks 治理建议时使用。触发词：复盘本轮、session reflection、总结这次会话、记忆/工作流/Skill/Hooks 优化建议。每次「📌 下一步推荐」都会固定提示该 skill；不要在 subagent 任务里调用。
---

# Session Reflection

复盘当前会话，把高价值经验落到 4 类长期资产：
**全局记忆（MEMORY.md）/ 可复用工作流 / Skill 优化 / Hooks 使用**。

## 何时使用

- 任务已闭合（出现 `✅ DONE` / `⚠️ DONE_WITH_CONCERNS`）或对话即将结束。
- 用户输入「复盘 / session reflection / 给点优化建议」。
- 出现「早知道就……」信号：反复修同类 bug、用错 skill、hook 噪声大、记忆缺口明显。
- **不直接处理**：hook 报错 / SKILL 脚本失败 / dispatch 异常等 runtime 故障 → 先用 `trigger-telemetry-advisor` 看 hook telemetry 归因，再决定是否需要复盘层面的治理改动。

## 何时不使用

- 任务未收尾，先完成再复盘。
- 短会话（< 3 轮有效编码交互），样本不足。
- 自己作为 subagent 被派遣（看到 `<SUBAGENT-STOP>` 即跳过）。

## 工作流（七步）

1. **采样**：列出本轮 prompt、纠错信号、调用过的 skill/tool/hook、失败重试与绕路。
2. **打标签**：每条观察归入 `memory` / `workflow` / `skill` / `hook` 之一；放不进的丢「不沉淀清单」。
3. **去重对照**：候选记忆条目与现有 `MEMORY.md` 比对，重复用 `[更新]`；候选 skill 改动对照实际 SKILL.md description。
4. **量化收益**：每条建议附「不做会怎样 / 做了能省什么」，无法量化的不写。
5. **筛选**：记忆 ≤ 5、工作流 ≤ 2、skill 改动 ≤ 3、hook 改动 ≤ 2，按「重复成本 × 命中频率」砍尾。
6. **生成报告**：按 [references/output-contract.md](references/output-contract.md) 的五段格式输出。
7. **关闭闭环**：报告末尾给一条最优先的 Next Action（路径级别）。

## 报告输出

固定五段，详见 [references/output-contract.md](references/output-contract.md)：

1. 一句话结论（TL;DR）
2. 高价值证据点（来源 / 现象 / 启示 三列表）
3. 长期资产建议（4 子节：记忆 / 工作流 / Skill / Hooks）
4. 不沉淀清单（明示放弃）
5. 可执行 Next Action

每段必须出现，没内容写「无」并解释。

## 写记忆硬规则

- 用绝对日期，不写「明天 / 上周」。
- `feedback` / `project` 类必须带 **Why** 和 **How to apply**。
- 只沉淀「跨会话仍成立」的内容，禁止把当前 PR 状态写进长期记忆。
- 与现有条目矛盾先标记冲突再给取舍，禁止默默覆盖。
- 禁止把代码风格 / 文件路径 / git 历史写进记忆——这些可现场重读。

## Skill 改动建议硬规则

- 给出 SKILL.md 路径与 frontmatter `description` 的具体改法（不是「改一下描述」）。
- 描述改动包含：增/删的触发词、典型 prompt 示例、何时不使用。
- 新增 skill 必须给出 name、所属插件、3 行 description、关键 prompt 示例。

## Hook 改动建议硬规则

- 注明 hook 事件（SessionStart / UserPromptSubmit / PostToolUse / Stop）。
- 给出匹配条件（matcher / 关键词 / payload 字段），禁止「全局始终注入」。
- 涉及 gate 类必须说明误判样本。

## 反模式（NEVER）

详见 [references/anti-patterns.md](references/anti-patterns.md)：
git diff 当复盘、写「下次注意」无规则、写当前 PR 编号、≥ 5 条记忆、subagent 内调用、不读现有 MEMORY 就建议新增、只夸不批。

## 调用示例

`请用 /session-reflection 复盘本轮会话`

完成后由用户决定哪几条落地，本 skill 不主动改 MEMORY.md / hooks / skill 文件。
