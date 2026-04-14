---
name: gh-address-comments
description: 当用户需要用 gh CLI 拉取当前分支关联 PR 的评论、归类待处理项并推进修复时使用。
---

# GitHub PR 评论处理

## 适用场景
- 处理 reviewer 评论、review thread 和顶层 issue comment。
- 需要先汇总评论，再让用户指定要处理的编号。
- 想把 PR 待办分成“立即修”“需澄清”“暂不处理”三类。

## 核心约束
- 开始前必须确认 `gh auth status` 成功。
- 优先使用 [scripts/fetch_comments.py](scripts/fetch_comments.py) 拉全量评论，不要只看 `gh pr view --comments`。
- 默认先做只读归类，除非用户明确指定要处理哪些评论。
- 修改代码后要回到评论编号，逐项说明已处理、需澄清或拒绝原因。

## 代码模式
- 拉取当前分支 PR 的完整评论数据：

```bash
python3 scripts/fetch_comments.py > /tmp/pr-comments.json
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
- 未经用户确认就默认“处理全部评论”。
- 只看最新一页评论，遗漏旧 thread 或 resolved 状态。
- 修代码时不回溯评论编号，导致用户无法核对闭环。
- 把讨论型评论当成必须修改的阻断项。
