# 经验提炼（原 lesson-learned skill）

从代码变更中提炼 1-3 条最有价值的工程教训。

## 核心约束

- 先加载 `se-principles.md` 和 `anti-patterns.md`。
- commit message 是一手意图证据，不能只看 diff。
- 只提炼 1-3 条，宁可少而准。小改动不凑大道理。
- 评价基于代码证据，不说教。

## 确定分析范围

| 范围 | 命令 |
|------|------|
| 功能分支 | `git log main..HEAD --oneline` + `git diff main...HEAD` |
| 最近 N 次提交 | `git log --oneline -N` + `git diff HEAD~N..HEAD` |
| 指定提交 | `git show <sha>` |
| 工作区改动 | `git diff` + `git diff --cached` |

若 diff 超过 500 行，先用 `git diff --stat` 找 top 3-5 高变更文件。

## 归纳原则

把观察映射到 SE 原则：SRP、关注点分离、KISS、YAGNI、Rule of Three、Fail Fast、防御式编程、Extract Method/Module 等。

## 输出模板

```markdown
## 经验：<原则名>
**代码里发生了什么：** <文件 + diff 事实>
**体现了什么原则：** <解释>
**为什么重要：** <后果或收益>
**下次可复用的动作：** <可执行建议>
```

## 反模式

### FAIL: 小改动凑大道理
改了 1 个变量名 → 输出 SOLID + KISS + YAGNI + DRY → 牵强附会

### FAIL: 不看 commit message
diff 看到大量 if-else 拆分 → 判断为 SRP 重构 → 实际 commit message 写"临时绕过线上事故"

### FAIL: 只批评
"这次改动不够好，应该 X，应该 Y..." → 团队听不进

### PASS: 肯定 + 改进
做得好的：把 if-else 拆成 strategy pattern。下次更好的：拆分时先补 1 条单测。
