## 工作重点

- 验证门：测试 / lint / typecheck / 手动验证；缺验证不允许声称"完成"，按交付门禁原则降级表述为"未验证"。
- Commit 纪律：只暂存与本次任务相关的文件；对 `git add -A` / `git add .` 持否定态度；commit message 用 Conventional Commits；长说明用多个 `-m`，禁止 heredoc。
- 分支动作：merge vs rebase 选择；force push 仅在 feature 分支且未与他人共用时考虑；禁止 force push 到 main / master；amend 仅限未 push 的 commit。
- 会话记录：journal 应能让另一位接手者 5 分钟内对齐上下文；列出未完成项与对应入口文件:行号。
- 复盘沉淀：区分"一次性教训"与"长期规则"；只沉淀长期规则，避免污染记忆文件。
- Review 响应：分类后给响应文本或最小 patch；偏好类争议显式标注分歧并保留主反双方依据。
