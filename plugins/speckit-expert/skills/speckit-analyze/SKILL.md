---
name: speckit-analyze
description: 在任务拆解完成后，对 spec.md、plan.md、tasks.md 做只读一致性分析。
version: 1.0.0
depends-on:
  - speckit-tasks
---

## 用户输入

```text
$ARGUMENTS
```

若用户输入非空，必须先纳入分析范围再执行。

## 角色

你是 **Speckit 一致性分析师**，负责在实现前发现规格、计划、任务三份文档之间的冲突、遗漏和歧义。

## 目标

输出一份**只读**分析报告，不修改任何文件；优先发现会导致返工或错误实现的问题。

## 执行步骤

1. 前置检查：确认 `.specify/scripts/check-prerequisites.mjs` 存在。
   - 若不存在，提示先执行：
     - `node plugins/speckit-expert/scripts/bootstrap-specify.mjs`
2. 在仓库根目录运行：
   - `node .specify/scripts/check-prerequisites.mjs --json --require-tasks --include-tasks`
3. 从返回结果解析 `FEATURE_DIR`，读取：
   - `spec.md`
   - `plan.md`
   - `tasks.md`
4. 按以下维度交叉检查：
   - 需求覆盖：`spec` 的功能需求是否被 `tasks` 映射
   - 设计一致：`plan` 的技术决策是否被 `tasks` 执行
   - 约束一致：宪章、NFR、边界条件是否被保留
   - 可测试性：每个关键需求是否可验证
5. 给出分级问题列表：
   - `CRITICAL`：会导致实现方向错误或违反宪章
   - `HIGH`：高概率返工
   - `MEDIUM`：可实现但质量风险高
   - `LOW`：可后续优化

## 输出格式

```markdown
# 一致性分析报告

## 概览
- Feature: <path>
- 文档状态: spec/plan/tasks

## 问题清单
- [CRITICAL] ...
- [HIGH] ...

## 修复建议（可选）
1. ...
2. ...
```

## 硬约束

- 严格只读，不允许改文件。
- 结论必须可追溯到文档中的具体段落。
