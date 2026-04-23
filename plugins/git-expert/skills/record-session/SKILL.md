---
name: record-session
description: 当用户要记录本次开发会话的成果摘要、保存 session journal 或在结束工作前总结做了什么时使用。
---

# 会话记录

## 适用场景

- 用户完成一段开发工作后，想把本次会话的成果结构化地记录下来。
- 需要在"下一次会话"能快速恢复上下文（做了什么、改了哪些文件、遗留什么问题）。
- 搭配 [lesson-learned](../lesson-learned/SKILL.md) 把经验一并沉淀。
- 搭配 [engineering-retro](../engineering-retro/SKILL.md) 做周期性回顾。

## 核心约束

- 必须先确认代码已提交或有明确的工作区状态，不记录"打算做但没做"的事。
- 记录基于 git 证据（log、diff、status），不凭记忆编造。
- session 摘要写入记忆文件（memory），不在用户项目目录创建文件。
- 一条 session 记录控制在 300 字以内，过长则拆成"摘要"和"细节"两部分。
- 不评价工作质量，只记录事实和决策。

## 实施步骤

### 步骤 1：采集证据

```bash
# 本次会话涉及的提交
git log --oneline --since="$(date -v-4H +%Y-%m-%dT%H:%M:%S)" 2>/dev/null \
  || git log --oneline -10

# 变更文件统计
git diff --stat HEAD~N..HEAD   # N = 本次提交数

# 当前工作区状态
git status --short
```

若用户指定了 commit 范围或分支，优先使用用户给定的范围。

### 步骤 2：构建 Session 记录

按以下模板生成记录：

```markdown
## Session: <日期> — <一句话主题>

**分支**: <branch-name>
**提交范围**: <first-sha>...<last-sha> (<N> commits)

### 完成的工作
- <改动 1：动词 + 目标 + 关键文件>
- <改动 2>

### 关键决策
- <决策 1：选了什么方案，为什么>

### 遗留事项
- <TODO 1：下次需要继续的>
- （无则写"无遗留"）

### 变更文件
<git diff --stat 输出，或 top 5 高变更文件>
```

### 步骤 3：保存到记忆

将 session 记录作为 `project` 类型保存到记忆文件中：
- name: `session-<日期>-<主题slug>`
- description: 一句话概述本次会话成果
- 内容：步骤 2 生成的完整记录

### 步骤 4：联动建议

根据本次工作内容，建议是否需要：
- `/lesson-learned`：若有值得提炼的工程经验
- `/engineering-retro`：若已积累多次 session，适合做周期回顾

## 检查清单

- [ ] 是否基于 git log/diff 采集了实际证据
- [ ] 摘要是否简洁（≤300 字），聚焦"做了什么"和"决策"
- [ ] 遗留事项是否明确标注
- [ ] 是否保存到了记忆文件
- [ ] 是否避免了主观评价（"做得好/不好"）

## 反模式

### FAIL: 凭印象记录

```
"这次大概改了一些组件，优化了性能"
→ 没有文件名、没有 commit 引用、没有具体数据
→ 下次恢复上下文时毫无帮助
```

### PASS: 证据驱动的记录

```markdown
## Session: 2026-04-24 — 优化列表渲染性能

**分支**: feat/virtual-list
**提交范围**: a1b2c3d...e4f5g6h (3 commits)

### 完成的工作
- 替换 FlatList 为 FlashList（src/components/FeedList.tsx）
- 添加 getItemType 分类器减少跨类型回收（+45 行）
- 修复 keyExtractor 使用 index 导致的重渲染

### 关键决策
- 选 FlashList 而非自写虚拟滚动：社区维护、API 兼容

### 遗留事项
- 需要在低端设备上验证帧率
```

### FAIL: 写成流水账

```
"先看了代码，然后想了想，然后改了 A，又改了 B，
 中间 debug 了一会儿，最后终于搞定了"
→ 过程叙事，没有结果总结
```

### PASS: 结果导向

```
完成的工作：
- 修复 login API 401 循环（auth/interceptor.ts:23-45）
关键决策：
- 改用 refresh token 重试而非直接登出
遗留事项：
- refresh token 过期的 edge case 待处理
```
