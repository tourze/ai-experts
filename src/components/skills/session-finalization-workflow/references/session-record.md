# 会话记录

原 record-session 流程，已合并到 Step 4。

## 核心约束

- 必须先确认代码已提交或有明确的工作区状态，不记录"打算做但没做"的事。
- 记录基于 git 证据（log、diff、status），不凭记忆编造。
- session 摘要写入记忆文件（memory），不在用户项目目录创建文件。
- 一条 session 记录控制在 300 字以内，过长则拆成"摘要"和"细节"两部分。
- 不评价工作质量，只记录事实和决策。

## 采集证据

```bash
git log --oneline --since="$(date -v-4H +%Y-%m-%dT%H:%M:%S)" 2>/dev/null || git log --oneline -10
git diff --stat HEAD~N..HEAD
git status --short
```

若用户指定了 commit 范围，优先使用用户给定的范围。

## 输出模板

```markdown
## Session: <日期> — <一句话主题>

**分支**: <branch-name>
**提交范围**: <first-sha>...<last-sha> (<N> commits)

### 完成的工作
- <改动 1：动词 + 目标 + 关键文件>

### 关键决策
- <决策 1：选了什么方案，为什么>

### 遗留事项
- <TODO 1：下次需要继续的> / 无遗留

### 变更文件
<git diff --stat 输出，或 top 5>
```

## 反模式

### FAIL: 凭印象记录
"这次大概改了一些组件，优化了性能" → 没有文件名、没有 commit、没有数据

### FAIL: 写成流水账
"先看了代码，然后想了想，然后改了 A..." → 过程叙事，没有结果总结

### PASS: 证据驱动
```markdown
完成：修复 login API 401 循环（auth/interceptor.ts:23-45）
决策：改用 refresh token 重试而非直接登出
遗留：refresh token 过期的 edge case 待处理
```
