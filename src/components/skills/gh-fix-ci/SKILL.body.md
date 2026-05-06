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
