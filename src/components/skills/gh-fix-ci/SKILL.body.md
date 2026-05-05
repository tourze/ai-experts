## 代码模式
- 使用内置脚本抓取失败检查：

```bash
node scripts/inspect_pr_checks.mjs --repo .
node scripts/inspect_pr_checks.mjs --repo . --pr 123 --json
node scripts/inspect_pr_checks.mjs --repo . --max-lines 200 --context 40
```

- 手工兜底命令：

```bash
gh pr checks 123 --json name,state,conclusion,detailsUrl,startedAt,completedAt
gh run view 987654321 --json name,workflowName,conclusion,status,url,event,headBranch,headSha
gh run view 987654321 --log
```

## 检查清单
- 是否确认目标 PR 编号，或当前分支是否有关联 PR。
- 是否列出所有 failing check，并区分 GitHub Actions / 外部 provider。
- 是否提取 run id、job id、run URL 与最小失败片段。
- 是否说明日志不可用、仍在运行或需要更高权限的情况。
- 是否在改代码前给出一份聚焦修复计划。

## 反模式

### FAIL: 凭名字猜失败原因

```
"check 'lint' 挂了 → run prettier --write"
→ 实际：lint 是 ESLint，规则更新后 50 处违规
```

### PASS: 先抓日志再下结论

```bash
gh run view 987654321 --log | grep -E "error|fail" | head -20
```

### FAIL: 直接改不确认

```
看到类型错误 → git commit -m "fix"
→ 用户想先讨论根因，PR 又一次 force push
```

### PASS: 先聚焦修复计划

```
失败摘要：check 'typecheck' (run 12345)
错误：src/api.ts:42 Property 'email' missing
推测原因：上周改了 User schema
方案 A：加 email 字段
方案 B：用 Pick 排除
请确认
```

### FAIL: 整段日志砸过去

```
"日志：[10000 行] 请看一下"
→ 用户没法读
```

### PASS: 摘要 + 上下文片段

```
关键失败 (build/test:42-58):
  TypeError: Cannot read property 'id' of undefined
  at OrderService.process (src/order.ts:120)
完整日志：<run URL>
```

## 参考资料

- [create-github-action-workflow-specification.md](references/create-github-action-workflow-specification.md) — 将工作流提炼为规范文档
- [gh-address-comments.md](references/gh-address-comments.md) — 处理 PR 评论与工作流管理
