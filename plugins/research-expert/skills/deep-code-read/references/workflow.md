# Deep Code Read — 完整工作流

## Phase 1: 准备

1. 确定项目名：本地路径 → 目录名；GitHub URL → 仓库名
2. URL 模式：克隆到 `{output-dir}/{project-name}/`（已存在则跳过）
3. 本地模式：验证路径存在且为 git 仓库，直接使用（只读）
4. 检测版本：`git tag --list`，有 tag 推荐最新 semver，无则推荐 main/master
5. **暂停** — 向用户确认版本
6. Checkout 确认的 ref

## Phase 2: 扫描

1. 扫描目录结构，识别模块边界：
   - `src/`、`lib/`、`pkg/`、`packages/` 下的顶层目录
   - 语言特有标志：`__init__.py`、`go.mod`、`package.json` 等
2. 分析模块间 import/依赖关系
3. **暂停** — 展示模块列表和依赖图，用户选择要精读的模块
4. 为每个选中模块创建 task

## Phase 3: 精读（Agent A）

对每个选中模块派遣子代理。

读取 `agent-a-prompt.md`，用以下变量渲染：

| 变量 | 含义 |
|------|------|
| `{source-dir}` | 源码仓库路径 |
| `{module-dir}` | 模块在仓库内的路径 |
| `{output-dir}` | skill 输出目录 |
| `{project-name}` | 项目名 |
| `{module-name}` | 模块名 |
| `{ref}` | 跟踪的 tag/分支 |

子代理参数：
- `prompt`: 渲染后的 agent-a-prompt.md
- `description`: "Deep read {module-name}"

完成后验证 `{output-dir}/{project-name}-dr-{module-name}/SKILL.md` 已写入。

## Phase 4: 验证（ABC 循环）

### Step 1 — Agent B 出题

- 渲染 `agent-b-prompt.md`，**用 haiku 模型**派遣
- 变量：`{source-dir}`、`{module-dir}`、`{module-name}`、`{previous_questions}`（首轮为空）
- 返回：verification 题目（含 required_facts）+ recommended 题目（留给 Phase 6）

### Step 2 — Agent C 闭卷答题

- 渲染 `agent-c-prompt.md`
- 变量：`{skill-dir}` = `{output-dir}/{project-name}-dr-{module-name}/`
- 变量：`{questions}` = B 的 verification 题目（**不含答案和 required_facts**）
- 返回：每题答案 + 置信度

### Step 3 — 评判

逐题对比 C 的答案与 B 的 `required_facts`：
- 所有 required_facts 覆盖 = PASS
- 任一缺失 = FAIL

### Step 4 — 循环决策

**硬性规则：100% 通过或跑满 3 轮，不可提前退出。**

- 100% → 模块验证完成，更新 task
- 任何失败 → 收集失败题目（题目 + B 的答案 + C 的错误答案），重新派遣 Agent A 补充 skill
- 再跑 B + C，传入所有历史题目作为 `{previous_questions}`
- 3 轮后仍有失败 → 向用户展示未解决题目和通过率

## Phase 5: 全局索引

所有模块验证完成后，生成 `{output-dir}/{project-name}-dr/SKILL.md`：

```yaml
---
name: {project-name}-dr
description: Use when working with {project-name} codebase — comprehensive module knowledge, design logic, and modification guides (from {ref})
---
```

内容：仓库来源、版本、时间戳、模块描述、依赖关系、跨模块场景指南。

## Phase 6: 用户验收

展示 recommended 问题，进入问答：仅凭 skill 文件回答，不读源码。答不出 = 差距信号。

## Phase 7: 清理

URL 模式：询问用户是否删除克隆目录。本地模式：跳过。
