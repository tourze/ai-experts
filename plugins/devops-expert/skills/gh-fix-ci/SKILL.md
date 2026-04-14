---
name: gh-fix-ci
description: 当用户要求排查或修复 GitHub Actions PR 检查失败时使用；先用 gh 获取失败上下文，再在获批后实施修复。
---

# GitHub Actions CI 排障

## 适用场景
- 当前分支或指定 PR 的 GitHub Actions 检查失败。
- 需要快速提取失败 job、运行链接和日志片段。
- 要区分 GitHub Actions 与外部检查提供方。

## 核心约束
- 开始前必须确认 `gh auth status` 成功，并且仓库可访问。
- 仅处理 GitHub Actions；Buildkite 等外部 provider 只报告 `detailsUrl`。
- 先汇总失败上下文与修复计划，得到用户确认后再改代码。
- 脚本参数必须与实现一致：`--repo`、`--pr`、`--max-lines`、`--context`、`--json`。

## 代码模式
- 使用内置脚本抓取失败检查：

```bash
python3 scripts/inspect_pr_checks.py --repo .
python3 scripts/inspect_pr_checks.py --repo . --pr 123 --json
python3 scripts/inspect_pr_checks.py --repo . --max-lines 200 --context 40
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
- 如果修复后还要处理 reviewer 评论，转到 [gh-address-comments](../gh-address-comments/SKILL.md)。

## 反模式
- 不看日志就凭名字猜测失败原因。
- 对外部 CI 系统做未授权尝试或臆测实现细节。
- 还没获得用户确认就直接修改业务代码。
- 只贴整段日志，不做失败摘要和可执行建议。
