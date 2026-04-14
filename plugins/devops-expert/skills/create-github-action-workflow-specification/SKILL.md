---
name: create-github-action-workflow-specification
description: 当用户需要把现有 GitHub Actions 工作流整理成实现无关、便于维护的规范文档时使用。
---

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
- 如果工作流里包含 API 契约生成或校验，顺带关联 [openapi-spec-generation](../openapi-spec-generation/SKILL.md)。

## 检查清单
- 是否写清所有触发器、分支过滤和路径过滤。
- 是否列出每个 job 的输入、输出、依赖与 runner。
- 是否记录 `permissions`、`environment`、`concurrency`、`timeout-minutes`。
- 是否说明制品、缓存、部署目标与回滚路径。
- 是否标出人工审批、环境保护规则和失败通知。
- 如果规范来自故障复盘，是否补充 [gh-fix-ci](../gh-fix-ci/SKILL.md) 提取出的失败场景。

## 反模式
- 把整个 workflow YAML 原样贴进规范，导致文档不可维护。
- 漏掉 `permissions`、`secrets`、环境保护规则等关键约束。
- 把 `run:` 里的命令逐行翻译成规范，导致规范与实现耦合。
- 只写 happy path，不写失败分支和人工介入点。
