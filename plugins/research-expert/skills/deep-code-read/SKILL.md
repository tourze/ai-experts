---
name: deep-code-read
description: 当用户要深度理解一个不熟悉的代码库并生成可复用的认知型 skill 文件时使用。支持 GitHub URL 或本地路径输入，通过 ABC 闭卷考试循环验证 skill 质量。与 repo-analyzer（快速评估）互补，本 skill 产出持久化的深度知识。
---

# Deep Code Reader

系统性精读代码库，产出经过闭卷验证的认知型 skill 文件。

灵感来源：[CiferaTeam/deep-code-reader](https://github.com/CiferaTeam/deep-code-reader)

## 适用场景

- 用户要深度理解陌生代码库，而不是只做快速仓库体检。
- 用户希望把代码库知识沉淀成可复用 skill。
- 用户能接受多轮闭卷验证，要求产出可被问答检验。

## 路由

- 快速评估 → [repo-analyzer](../repo-analyzer/SKILL.md)
- 架构依赖分析 → architecture-expert:codebase-analyst
- 深度认知 + 持久化 → 本 skill

## 用法

```
/deep-code-read <source> <output-dir>
```

## 流程总览

| Phase | 动作 | 暂停点 |
|-------|------|--------|
| 1. 准备 | 克隆/定位仓库，检测版本 | 确认 tag/分支 |
| 2. 扫描 | 识别模块边界和依赖 | 用户选择模块 |
| 3. 精读 | Agent A 逐模块生成 skill | — |
| 4. 验证 | ABC 闭卷循环（最多 3 轮） | 3 轮后仍失败则暂停 |
| 5. 索引 | 生成全局 index skill | — |
| 6. 验收 | 用户问答（仅凭 skill 回答） | 用户满意则结束 |
| 7. 清理 | 询问是否删除克隆源码 | — |

**MANDATORY — 执行前读取完整流程**: `references/workflow.md`

**MANDATORY — 派遣子代理前读取对应 prompt**:
- Agent A: `references/agent-a-prompt.md`
- Agent B: `references/agent-b-prompt.md`（用 haiku 模型）
- Agent C: `references/agent-c-prompt.md`

## 核心约束

- 源码只读，全程不修改
- Agent 隔离：A 读码写 skill，B 读码出题，C 只读 skill 答题
- 验证必须 100% 通过或跑满 3 轮，99% 不算通过
- 每个模块用 task 跟踪进度

## 代码模式

```bash
deep-code-read ./target-repo ./skills-output
```

## 检查清单

- [ ] 已确认源码版本、分支或 tag。
- [ ] 已选择模块边界并完成逐模块精读。
- [ ] ABC 闭卷验证通过或记录了 3 轮失败原因。
- [ ] 生成的 skill 能独立回答验收问题。

## 反模式

### FAIL: 快速扫描后直接写结论

只看 README 和目录树就生成 skill，无法回答实现细节问题。

### PASS: 闭卷验证驱动

让出题者基于源码提问，让答题者只读 skill 作答，用失败问题反向补齐 skill。
