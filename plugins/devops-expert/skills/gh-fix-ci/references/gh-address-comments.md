# GitHub PR 评论处理

## 适用场景
- 处理 reviewer 评论、review thread 和顶层 issue comment。
- 需要先汇总评论，再让用户指定要处理的编号。
- 想把 PR 待办分成“立即修”“需澄清”“暂不处理”三类。

## 核心约束
- 开始前必须确认 `gh auth status` 成功。
- 优先使用 [scripts/fetch_comments.mjs](scripts/fetch_comments.mjs) 拉全量评论，不要只看 `gh pr view --comments`。
- 默认先做只读归类，除非用户明确指定要处理哪些评论。
- 修改代码后要回到评论编号，逐项说明已处理、需澄清或拒绝原因。

## 代码模式
- 拉取当前分支 PR 的完整评论数据：

```bash
node scripts/fetch_comments.mjs > /tmp/pr-comments.json
jq '.conversation_comments | length, .review_threads | length' /tmp/pr-comments.json
```

- 推荐输出格式：

```text
[1] review thread - backend/api.py:42
问题：空值校验缺失
动作：补参数校验与测试

[2] issue comment
问题：文档缺少回滚说明
动作：更新 README/发布说明
```

## 检查清单
- 是否确认当前分支确实关联到一个 PR。
- 是否区分顶层评论、review 提交和 inline review thread。
- 是否给每条评论编号，并写出最小修复动作。
- 是否明确标出需要用户拍板的分歧点。
- 如果评论与 CI 失败关联，先参阅 [gh-fix-ci](../gh-fix-ci/SKILL.md)。

## 反模式

### FAIL: 默认”全部处理”

```
拉到 12 条 → 立刻改代码
→ 其中 3 条是讨论型，2 条是 reviewer “后面再确认”
→ PR 一堆冲突
```

### PASS: 先归类再请示

```
[1-5] 立即修：5 条 inline 问题
[6-8] 需澄清：3 条设计讨论
[9-12] 暂不处理：4 条 FYI
请确认处理哪些编号
```

### FAIL: 只看最新一页

```bash
gh pr view --comments   # 只看到最新 30 条
```

### PASS: 全量拉取

```bash
node scripts/fetch_comments.mjs > /tmp/pr.json
jq '.review_threads | length' /tmp/pr.json
```

### FAIL: 改代码不回溯编号

```
“我把那几个问题都修了”
→ reviewer 不知道哪条对应哪条
```

### PASS: 逐条回应

```
[1] backend/api.py:42 → 已加空值校验 (abc123)
[2] README → 已补回滚说明 (def456)
[3] 设计建议 → 倾向保留现方案，理由：...，请决定
```