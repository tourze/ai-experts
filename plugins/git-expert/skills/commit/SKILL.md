---
name: commit
description: 当用户要求提交代码、commit 变更或完成一组改动需要入库时使用。
user_invocable: true
---

# Git Commit — 结构化提交流程

本 skill 指导你完成一次高质量的 git commit。
遵循下方流程可以自动通过 git-expert 所有 PreToolUse 守卫。

---

## 第 1 步：确认工作区现状

并行执行以下命令，掌握全貌：

```bash
git status --short
```

```bash
git diff --stat
```

```bash
git log --oneline -5
```

目的：
- 识别哪些文件已修改、哪些未跟踪
- 了解最近提交风格，保持一致性
- 确认没有其他任务的残留改动

---

## 第 2 步：精确暂存文件

**逐个添加**当前任务涉及的文件，禁止批量暂存：

```bash
git add path/to/file1 path/to/file2
```

禁止使用的写法（会被 git-add-guard 拦截）：
- `git add .` / `git add *` / `git add -A` / `git add --all` / `git add -u`

如果文件较多，可以分组添加同一模块的文件：
```bash
git add src/auth/login.ts src/auth/logout.ts src/auth/types.ts
```

---

## 第 3 步：审查暂存内容

提交前必须审查 staged diff，确认内容只包含当前任务的变更：

```bash
git diff --cached --stat
```

```bash
git diff --cached
```

检查要点：
- 是否混入了不相关的文件
- 是否有调试代码残留（console.log、print、debugger）
- 是否有同一文件存在 staged + unstaged 的部分暂存情况

如果发现部分暂存，用以下命令分别检查：
```bash
git diff --cached -- <file>
git diff -- <file>
```

---

## 第 4 步：撰写提交信息并提交

### 格式要求：Conventional Commits

```
<type>(<scope>): <description>
```

**允许的 type：**

| type | 含义 |
|------|------|
| `feat` | 全新功能 |
| `fix` | 修复 bug |
| `docs` | 仅文档变更 |
| `style` | 格式调整（不影响逻辑） |
| `refactor` | 重构（不改变行为） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或外部依赖 |
| `ci` | CI/CD 配置 |
| `chore` | 其他杂务 |
| `revert` | 回滚提交 |

**scope 建议**：填写受影响的模块、目录或功能区域，如 `auth`、`api`、`git-expert`。

**description 要求**：
- 说清楚改了什么、为什么改
- 不能是模糊词（fix、update、move、调整、优化）
- 首行不少于 8 个字符

### 提交命令格式

单行提交：
```bash
git commit -m "feat(auth): add OAuth2 login support for GitHub provider"
```

带补充说明的提交（使用多个 `-m`）：
```bash
git commit -m "fix(parser): handle unclosed brackets in nested expressions" -m "The parser was silently dropping unclosed brackets, causing downstream type errors. Added bracket-balancing check before AST construction." -m "Closes #142"
```

**禁止使用 heredoc**（会被 git-commit-heredoc-guard 拦截）：
```bash
# 错误写法，不要使用
git commit -m "$(cat <<'EOF'
message
EOF
)"
```

### 提交信息撰写决策树

1. 是全新能力？ → `feat`
2. 是修复已有 bug？ → `fix`
3. 行为不变，结构改善？ → `refactor`
4. 只改了性能？ → `perf`
5. 只改了测试？ → `test`
6. 只改了文档？ → `docs`
7. 只改了构建/CI？ → `build` 或 `ci`
8. 以上都不是 → `chore`

### 高质量提交信息示例

```
feat(git-expert): add commit workflow skill with staged-diff review

Guides the user through a structured commit flow: status check,
precise staging, diff review, and conventional commit message.
Designed to pass all PreToolUse guards automatically.
```

```
fix(hooks): prevent false positive in commit-scope-guard for single-package changes

The guard was counting doc files toward dir-spread threshold,
triggering warnings on single-module documentation updates.
```

```
refactor(dispatch): extract shell argument parser into shared utility

Consolidates duplicated arg-parsing logic from 4 guards into
_shell-utils.mjs, reducing total LoC by ~120.
```

---

## 第 5 步：验证提交结果

```bash
git log --oneline -3
```

确认提交已成功记录。

---

## 提交范围自检（对应 commit-scope-guard）

提交前自查以下几点，避免被 report 提醒：

| 维度 | 阈值 | 建议 |
|------|------|------|
| 暂存文件数 | > 15 | 拆分为多个原子提交 |
| 顶层目录数 | >= 4 | 按子系统拆分 |
| monorepo 包数 | >= 2 | 一包一提交 |
| 业务 + 配置混合 | 同时存在 | 先配置后业务，分开提交 |

如果确实是跨切面的合理变更（如全局 rename），可以忽略范围提醒，但需在提交信息中说明原因。

---

## 流程总结

```
git status --short          ← 掌握全貌
git add <具体文件>           ← 精确暂存
git diff --cached --stat    ← 审查范围
git diff --cached           ← 审查内容
git commit -m "type(scope): description"  ← 提交
git log --oneline -3        ← 验证
```
