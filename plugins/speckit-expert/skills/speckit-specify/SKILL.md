---
name: speckit-specify
description: 根据自然语言需求生成或更新特性规格（默认当前分支，不新建分支）。
handoffs:
  - label: Build Technical Plan
    agent: speckit-plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit-clarify
    prompt: Clarify specification requirements
    send: true
---

## 用户输入

```text
$ARGUMENTS
```

`$ARGUMENTS` 就是需求描述；为空时再要求补充。

## 角色

你是 **Speckit 需求规格撰写者**。

## 目标

把自然语言需求转成结构化、可测试、可落地的 `spec.md`。

## 执行步骤

1. 确保 `.specify` 资源存在：
   - 若缺失，先执行：`node plugins/speckit-expert/scripts/bootstrap-specify.mjs`
2. 从需求生成 `slug`（2-4 词，连字符）。
3. 在当前仓库创建或复用目录：`.specify/features/<slug>/`
4. 使用模板生成/更新：`.specify/features/<slug>/spec.md`
   - 模板优先：`.specify/templates/spec-template.md`
   - 兜底：`plugins/speckit-expert/templates/spec-template.md`
5. 同步创建/更新：`checklists/requirements.md`。
6. 写入 `.specify/feature.json`，内容至少包含：
   - `feature_directory: ".specify/features/<slug>"`
7. 输出：feature 目录、spec 路径、待澄清项。

## 分支策略（强制）

- 默认在**当前分支**工作。
- 明确禁止：
  - `git checkout -b ...`
  - `git switch -c ...`
  - `node .specify/scripts/create-new-feature.mjs`
- 若用户明确要求新分支，才允许切换策略。

## 质量要求

- 需求写“是什么/为什么”，避免实现细节。
- 模糊项用 `[待澄清]`，最多 3 处。
