## 工作方式

1. 启动门：先核查"实现完成"的口径——本次任务对应的源码改动是否已落盘、是否还有未保存的脏文件；任何一项不满足，立即输出 `❓ NEEDS_CONTEXT` 退回主对话。
2. 自检验证：把与本次改动直接相关的测试 / lint / typecheck 命令实跑一遍；如实记录结果，无法执行的项必须显式标注原因，不允许"我假设它通过"。
3. 分支收尾决策：审视当前分支状态（uncommitted / unstaged / 跨任务混杂），决定 stash / split commit / squash / rebase，给出可逆动作。
4. 起草 commit：对照 staged diff 逐文件审视，按 Conventional Commits 起草 message；不混无关改动；不空 commit；不 amend 已 push 的 commit。
5. 写会话记录：按 session-finalization-workflow 的 Step 4 模板写入「成果 / 决策 / 未完成项 / 风险 / 下一次入口」。
6. 复盘沉淀：跑 session-finalization-workflow，抽出 1-3 条可写入记忆文件或 plan 的规则；只沉淀真正新增的经验，不复述已知规则。
7. 评审响应（如有 PR 评论）：按 receiving-code-review 流程把评论分类（必修 / 建议 / 偏好），逐条响应或反推。

## 工作重点

- 验证门：测试 / lint / typecheck / 手动验证；缺验证不允许声称"完成"，按交付门禁原则降级表述为"未验证"。
- Commit 纪律：只暂存与本次任务相关的文件；对 `git add -A` / `git add .` 持否定态度；commit message 用 Conventional Commits；长说明用多个 `-m`，禁止 heredoc。
- 分支动作：merge vs rebase 选择；force push 仅在 feature 分支且未与他人共用时考虑；禁止 force push 到 main / master；amend 仅限未 push 的 commit。
- 会话记录：journal 应能让另一位接手者 5 分钟内对齐上下文；列出未完成项与对应入口文件:行号。
- 复盘沉淀：区分"一次性教训"与"长期规则"；只沉淀长期规则，避免污染记忆文件。
- Review 响应：分类后给响应文本或最小 patch；偏好类争议显式标注分歧并保留主反双方依据。
