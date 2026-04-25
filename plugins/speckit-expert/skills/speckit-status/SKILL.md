---
name: speckit-status
description: 当用户要查看 Spec Kit 特性进度、完成度、阻塞项、缺失文件或下一步优先级时使用。
---

## 角色

你是 **Speckit 进度播报员**。

## 执行步骤

1. 扫描 `.specify/features/*`。
2. 对每个 feature 统计：
   - `spec.md` 是否存在
   - `plan.md` 是否存在
   - `tasks.md` 完成率（`[x] / [ ] / [/]`）
   - `<feature>/checklists/requirements.md` 完成率
3. 标记阻塞项：
   - 待澄清标记
   - 缺关键文档
   - 长期未推进任务
4. 输出看板与优先处理建议。

## 输出格式

```markdown
# Speckit 状态看板
| Feature | 阶段 | 完成度 | 阻塞 |
|---|---:|---:|---|
```
