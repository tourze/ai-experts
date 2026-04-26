---
name: subagent-driven-development
description: "当有实现计划或 Execution Contract 需要在当前会话中执行、且用户明确要求子代理/worker/多 agent/并行实现时使用——按 wave 与 write_scope 派遣独立子代理，配合双阶段审查（规格合规 + 代码质量）完成实现。"
---

# 子代理驱动开发

## 适用场景

- 有一份实现计划或 Execution Contract（来自 `task-decomposer`、`feature-dev`、`persistent-planning` 等），且用户明确要求子代理、worker、多 agent 或并行实现。
- 需要消费 `task-decomposer` 输出的 `waves` / `read_scope` / `write_scope` / `acceptance`，并把计划推进到实际修改。
- 需要在当前会话中连续执行多个任务而不污染主上下文。
- 交叉引用：任务拆解用 `task-decomposer`；方案审查用 `plan-review`；完成后用 `finishing-branch`。

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 执行前必须把计划规整为 wave；没有 wave 时按依赖关系先生成顺序 wave。
- 同一 wave 只有 `write_scope` 互不重叠的任务才能并行；重叠任务必须拆到不同 wave 或合并。
- 实现任务必须有 `write_scope` 和验收引用；缺失时先补计划，不派遣。
- 子代理可读取范围 = `read_scope ∪ write_scope`；`read_scope` 不必重复列出将要编辑的文件。
- 每个任务用全新子代理执行，不复用会话上下文。
- 子代理接收完整任务文本、读写范围、依赖、验收项，不让子代理自己去读计划文件。
- 必须经过双阶段审查：先规格合规，再代码质量，顺序不可颠倒。
- `evidence_type: "command"` 的验收项必须由主会话运行并记录结果，不能只采信子代理报告。
- 审查不通过 → 修复 → 重新审查，直到通过。

## Iron Law

```
每个任务：wave 隔离 + write_scope 不重叠 + 独立子代理 + 双阶段审查
```

## 流程

```
1. 一次性读取计划，提取所有任务、依赖、读写范围、验收项
2. 将计划规整为 wave，并验证同 wave write_scope 不重叠
3. 为每个任务创建 Todo 跟踪

按 wave 执行：
  4. 只派遣当前 wave 中可并行的任务
  5. 派遣实现子代理（提供完整任务文本 + 项目上下文 + read_scope/write_scope + acceptance_refs）
  6. 处理子代理状态（见"状态处理"）
  7. 派遣规格审查子代理 → 确认实现匹配计划和验收项
  8. 派遣代码质量审查子代理 → 确认代码质量
  9. 主会话运行当前任务绑定的 acceptance.command，并记录命令、退出码和关键输出
  10. 当前 wave 全部审查通过且验收证据齐备后，集成结果并进入下一 wave

所有任务完成后：
  11. 派遣最终全局审查子代理
  12. 使用 finishing-branch 完成开发
```

## Execution Contract 消费规则

当输入包含 `Execution Contract` 时，它是执行边界，不是建议。

```json
{
  "waves": [
    {
      "id": "W1",
      "tasks": [
        {
          "id": "T001",
          "intent": "observable task outcome",
          "read_scope": ["src/auth/**"],
          "write_scope": ["src/auth/token.ts"],
          "depends_on": [],
          "acceptance_refs": ["A1"]
        }
      ]
    }
  ],
  "acceptance": [
    {
      "id": "A1",
      "must": "token refresh keeps existing sessions valid",
      "evidence_type": "command",
      "command": "npm test -- auth-token"
    }
  ]
}
```

消费规则：
- `write_scope: []` 只允许只读探索；实现子代理不能写文件。
- 子代理读取范围是 `read_scope ∪ write_scope`；编辑目标文件允许读取，即使它没有重复出现在 `read_scope`。
- 同一 wave 内 `write_scope` 有交集时，先停下重排 wave，不要并行派遣。
- `depends_on` 未完成的任务不能提前执行。
- 子代理 prompt 必须包含对应的 `acceptance_refs` 详情，不能只给编号。
- `evidence_type: "command"` 必须提供 `command`；命令缺失时合同无效，先补计划。
- `acceptance.command` 是主会话必须运行的验证门禁；子代理报告的测试结果不能替代主会话验证。

## 验收证据门

每个任务完成双阶段审查后，按其 `acceptance_refs` 收集证据：

| evidence_type | 主会话动作 |
|------|------|
| `command` | 运行 `acceptance.command`，记录命令、退出码和关键输出；失败则任务未完成 |
| `diff` | 对照 diff 确认可观察要求满足，并记录检查范围 |
| `artifact` | 确认可交付文件存在且内容匹配验收项 |
| `manual` | 记录手动检查步骤、结果和无法自动化原因 |

只有绑定的验收项全部有证据后，任务才能标记完成；只有当前 wave 所有任务完成后，才能进入下一 wave。

## 子代理状态处理

实现子代理报告四种状态之一：

| 状态 | 含义 | 处理 |
|------|------|------|
| **DONE** | 完成，无顾虑 | 直接进入规格审查 |
| **DONE_WITH_CONCERNS** | 完成，但有疑虑 | 读取疑虑，判断是否需处理后再审查 |
| **NEEDS_CONTEXT** | 缺少信息 | 补充上下文后重新派遣 |
| **BLOCKED** | 无法完成 | 评估阻塞原因（见下方处理规则） |

### BLOCKED 处理规则

1. 上下文不足 → 补充上下文，同一模型重试
2. 任务超出模型能力 → 用更强模型重试
3. 任务太大 → 拆分成更小的子任务
4. 计划本身有问题 → 升级给用户

**绝不**忽视 BLOCKED 状态或强迫同一模型重试而不做任何改变。

## 双阶段审查

### 阶段一：规格合规审查

> "实现是否匹配计划中的要求？"

- 检查所有计划要求是否已实现
- 检查是否有计划之外的额外添加（YAGNI 违规）
- 发现问题 → 实现子代理修复 → 重新审查

### 阶段二：代码质量审查

> "代码本身写得好不好？"

- 只有规格审查通过后才进入此阶段
- 检查命名、错误处理、测试覆盖、架构
- 发现问题 → 实现子代理修复 → 重新审查

**顺序不可颠倒**：先确认"做对了事"，再确认"事做得好"。

## 模型选择

用最低成本能胜任的模型，节省预算和时间。

| 任务类型 | 推荐模型 |
|---------|---------|
| 机械实现（1-2 个文件，明确规格） | 快速/便宜模型 |
| 集成和判断（多文件协调，模式匹配） | 标准模型 |
| 架构、设计、审查 | 最强模型 |

## 子代理 Prompt 模板

完整 prompt 模板见 [references/prompt-templates.md](./references/prompt-templates.md)，包含实现者、规格审查员、代码质量审查员三个角色的模板。

## Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "这个任务太小了，不用派子代理" | 子代理隔离上下文、保持专注。用。 |
| "审查太慢了，跳过这次" | 跳过审查 = 跳过质量。不跳。 |
| "规格审查和代码审查合并做" | 两个阶段关注点不同。分开做。 |
| "子代理说完成了，直接下一个" | 子代理可能过于乐观。独立审查。 |
| "子代理已经跑了测试，主会话不用跑" | `acceptance.command` 必须由主会话重新运行。 |
| "同一个 wave 就都能并行" | 只有写范围不重叠才并行。 |
| "write_scope 缺了也能先做" | 缺执行边界 = 先补计划。 |
| "下一波可以先启动等着" | 依赖未验收前不提前派遣。 |
| "先做代码质量审查" | 做对事 → 做好事。规格先行。 |
| "自己顺手修比派子代理快" | 手动修 = 上下文污染。派子代理。 |

## 检查清单

- [ ] 一次性读取了完整计划
- [ ] 计划已规整为 wave，并检查同 wave `write_scope` 不重叠
- [ ] 每个实现任务都有 `write_scope` 与验收引用
- [ ] 为每个任务创建了 Todo
- [ ] 每个任务都用独立子代理实现
- [ ] 子代理收到了完整任务文本、读写范围和验收项（不是让它自己去读文件）
- [ ] 每个任务都经过了规格合规审查
- [ ] 规格通过后才进入代码质量审查
- [ ] 主会话已运行所有 `evidence_type: "command"` 的验收命令并记录结果
- [ ] 非命令验收项已有 diff/artifact/manual 证据
- [ ] 审查不通过的都经过了修复 + 重审
- [ ] 所有任务完成后做了全局审查
