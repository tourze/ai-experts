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

```bash
# 单行
git commit -m "feat(auth): add OAuth2 login support for GitHub provider"
# 多段（多个 -m）
git commit -m "fix(parser): handle unclosed brackets" -m "详细说明" -m "Closes #142"
```

**禁止 heredoc**（会被守卫拦截）和 `git commit` 不带 `-m`。

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

## 纪律守卫

**Iron Law：没有审查 staged diff，不允许执行 commit。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "改动很小，不用看 diff" | 小改动也能混入调试代码、敏感信息。看。 |
| "git add . 更方便" | 方便 = 不知道暂存了什么。逐文件添加。 |
| "先提交再说，有问题 amend" | amend 不能撤回已推送的提交。一次做对。 |
| "提交信息随便写个 fix" | "fix"不告诉任何人修了什么。6 个月后你自己也不知道。 |

**执行前必须读取** [references/discipline-guard.md](./references/discipline-guard.md)——包含完整 Red Flags 表和 Rationalizations 对照表。

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
