---
name: lesson-learned
description: 当用户要从代码变更、事故修复、评审反馈或提交历史中提炼工程教训、复盘经验和可沉淀规则时使用。
---

# 经验提炼

## 适用场景

- 用户想从最近一个分支、最近几次提交、某个 commit 或当前未提交改动里提炼工程经验。
- 希望把“刚做完的工作”映射成具名的软件工程原则，而不是泛泛而谈。
- 想复盘一次 feature、debug、refactor 或 cleanup，理解“这次到底做对了什么，或哪里还能更好”。

## 核心约束

- 开始前必须先读 `references/se-principles.md`；必要时再补读 `references/anti-patterns.md`。
- 只分析当前 diff 范围内的文件，不要顺手扫全仓。
- commit message 是一手意图证据，不能只看 diff。
- 只提炼 1-3 条最有价值的经验；宁可少而准，不要罗列大全。
- 评价风格要基于代码证据，优先说明“这段实现体现了什么”，而不是空口说教。

## 代码模式

### 1. 确定分析范围

常用范围与命令：

| 范围 | 命令 | 何时使用 |
|---|---|---|
| 功能分支 | `git log main..HEAD --oneline` + `git diff main...HEAD` | 在非主分支上 |
| 最近 N 次提交 | `git log --oneline -N` + `git diff HEAD~N..HEAD` | 主分支或用户指定 N |
| 指定提交 | `git show <sha>` | 用户明确给出 commit |
| 工作区改动 | `git diff` + `git diff --cached` | 还没提交时 |

### 2. 收集证据

- 先拿 commit 列表和 commit message。
- 再读对应 diff。
- 若 diff 超过 500 行，先用 `git diff --stat` 找出 top 3-5 个高变更文件，再定向读。

### 3. 归纳原则

把观察映射到 `references/se-principles.md`：

- 结构边界：SRP、关注点分离、高内聚、低耦合
- 简化决策：KISS、YAGNI、Rule of Three
- 健壮性：Fail Fast、防御式编程、最小惊讶原则
- 重构动作：Extract Method、Extract Module、Replace Conditional 等

必要时用 `references/anti-patterns.md` 识别“下次可避免的模式”。

### 4. 输出模板

```markdown
## 经验：<原则名>

**代码里发生了什么：**
<2-3 句，点名文件、提交或 diff 事实>

**体现了什么原则：**
<1-2 句，解释原则本身>

**为什么重要：**
<1-2 句，说明实际后果或收益>

**下次可复用的动作：**
<1 句，可执行建议>
```

若还有补充点，最多再加 1-2 条“也值得一提”。

## 检查清单

- 是否先加载了 `references/se-principles.md`。
- 是否明确限定了分析范围，而不是泛化到整个仓库。
- 是否把 commit message 当作证据，而不是只看代码行变化。
- 是否把每条结论都落到具体文件、具体改动、具体取舍。
- 是否把经验压缩到 1-3 条最有价值的结论。

## 反模式

### FAIL: 小改动凑大道理

```
diff: 改了 1 个变量名
你输出：”这次改动体现了 SOLID 五大原则 + KISS + YAGNI + DRY...”
→ 牵强附会，没人当真
```

### PASS: 1-3 条最有价值的

```
diff: 1 行变量重命名
经验：可读性优于简洁性
代码事实：把 `cnt` 改成 `unread_count`，调用点 5 处变化但语义清晰
原则：KISS（不是越短越好）
下次：变量命名优先考虑被读 100 次的成本，而非写 1 次的成本
```

### FAIL: 不看 commit message

```
diff 看到大量 if-else 拆分
你：”这是 SRP 重构”
commit message：”临时绕过线上事故，待 Q4 重新设计”
→ 经验记反了
```

### PASS: 意图先于代码

```bash
git log main..HEAD --format=”%H %s%n%n%b”  # 拿全量信息
# message 中的 “fix” / “refactor” / “wip” 决定提炼方向
```

### FAIL: 只批评

```
“这次改动不够好，应该 X，应该 Y...”
→ 团队听不进，复盘失去价值
```

### PASS: 肯定 + 改进

```
**做得好的：**
- 把 if-else 13 层拆成 strategy pattern，可读性大幅提升

**下次更好的：**
- 拆分时若先补 1 条单测，重构信心会更强
```
