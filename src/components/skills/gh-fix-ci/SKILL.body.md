## 代码模式
- 使用内置脚本抓取失败检查：

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

- 手工兜底命令：

```bash
gh pr checks 123 --json name,state,conclusion,detailsUrl,startedAt,completedAt
gh run view 987654321 --json name,workflowName,conclusion,status,url,event,headBranch,headSha
gh run view 987654321 --log
```
