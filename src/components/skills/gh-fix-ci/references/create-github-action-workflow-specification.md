# GitHub Actions 工作流规范化

## 适用场景
- 需要把已有 `.github/workflows/*.yml` 提炼成规范文档。
- 准备重构或评审 CI/CD 流水线，先明确行为边界。
- 需要给 AI、测试或平台团队提供统一的工作流说明。

## 核心约束
- 先读现有工作流，再写规范；禁止凭空补业务流程。
- 文档写“做什么、何时做、依赖什么”，不要复述 shell 实现细节。
- 必须覆盖触发条件、权限、输入输出、并发、失败路径、质量门禁。
- 输出文件默认放到 `/spec/spec-process-cicd-[workflow-name].md`。

## 代码模式
- 推荐文档骨架：

```md
---
title: CI/CD 工作流规范 - build-and-release
version: 1.0
owner: DevOps Team
---

## 目标
- 构建、测试并发布制品

## 触发条件
- push: main
- pull_request: main
- workflow_dispatch

## 作业依赖
| Job | 目的 | 依赖 | 运行环境 |
| --- | --- | --- | --- |
| lint | 静态检查 | 无 | ubuntu-latest |
| test | 单元测试 | lint | ubuntu-latest |
| release | 发布制品 | test | ubuntu-latest |

## 约束
- permissions: contents: read
- concurrency: release-main
- timeout-minutes: 30

## 失败与恢复
- 测试失败：阻断发布
- 发布失败：保留日志并通知值班人
```

- 抽取顺序：
  1. `on`、`permissions`、`concurrency`
  2. `jobs` 拓扑与 `needs`
  3. `env`、`secrets`、`outputs`
  4. 质量门与审批点
- 如果工作流里包含 API 契约生成或校验，顺带关联 [openapi-spec-generation](../../openapi-spec-generation/SKILL.md)。

## 检查清单
- 是否写清所有触发器、分支过滤和路径过滤。
- 是否列出每个 job 的输入、输出、依赖与 runner。
- 是否记录 `permissions`、`environment`、`concurrency`、`timeout-minutes`。
- 是否说明制品、缓存、部署目标与回滚路径。
- 是否标出人工审批、环境保护规则和失败通知。
- 如果规范来自故障复盘，是否补充 [gh-fix-ci](../SKILL.md) 提取出的失败场景。

## 反模式

### FAIL: 复制粘贴 YAML

```md
## 实现
\`\`\`yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- run: npm test
\`\`\`
→ 改 action 版本要同时改两处 → 规范变第二份代码
```

### PASS: 写意图不写实现

```md
## test job
- 目的：在合并前验证单元测试通过
- 触发：所有 PR
- 依赖：lint job 通过
- 失败行为：阻断 merge，通知 PR 作者
- 不规定：用什么 Node 版本、用什么 action
```

### FAIL: 只写 happy path

```md
## release job
- 构建制品
- 推送到 registry
→ 推送失败怎么办？谁回滚？制品过期吗？
```

### PASS: 包含失败与人工

```md
## release job
- 成功路径：构建 → 推送 → 通知
- 失败路径：保留构建日志 30 天，自动通知 #oncall
- 回滚：手动 workflow_dispatch 触发 revert-release
- 审批门：production environment 需 1 人 approve
```