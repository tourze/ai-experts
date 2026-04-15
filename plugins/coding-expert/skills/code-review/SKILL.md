---
name: code-review
description: "语言无关的代码审查。聚焦命名、函数大小、单一职责、错误处理、边界情况、可读性和 DRY 违反，不涉及风格。"
metadata:
  version: "0.1.0"
  category: "code-quality"
  tags: ["review", "quality", "design", "readability"]
  when_to_use: "当用户要求审查代码、检查代码质量或发现实现中的问题时使用"
  trigger:
    - "review this code"
    - "code review"
    - "review PR"
    - "审查代码"
---

# 代码审查

## 适用场景
- 用户提交代码或文件，要求找出逻辑和设计层面的问题。
- 关注"代码写得好不好"，不是"能不能上线"（那用 `pre-landing-review`）。
- 交叉引用：高压审查配合 `brutal-honesty-review`；降低复杂度配合 `complexity-reducer`。

## 核心约束
- 先读真实代码或 diff，不凭猜测。
- 不审查纯风格问题（缩进、括号、行长度）——那是 linter 的事。
- 每条发现必须包含：文件位置、问题描述、改进建议。
- 按严重度分级：关键 > 重要 > 建议。
- 无问题则明确说明，不硬凑。

## 审查维度
审查时必须读取 [references/dimensions.md](./references/dimensions.md)，按六个维度逐项检查：命名与语义、函数设计、错误处理、逻辑与边界、DRY 与抽象、可读性。

## 输出格式
按"关键 → 重要 → 建议"分块，每条含文件位置、影响/原因、改进建议。

## 检查清单
- [ ] 已读取实际代码或 diff
- [ ] 每条发现含文件位置和改进建议
- [ ] 按严重度分级输出
- [ ] 未混入 linter 能抓的风格问题

## 反模式
- 不读代码，凭函数名猜问题。
- 把个人风格偏好当成质量问题。
- 所有问题都标"关键"，失去分级意义。
- 审查变重写：给整段替代代码而不是指出问题。
