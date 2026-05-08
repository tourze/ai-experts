# 提示模式

按策略组织的提示结构目录，附带模板和使用指南。

---

## 零样本

无示例。仅有直接指令。

```text
{Role/persona statement — optional}

{Task instruction}

{Input format specification}

{Output format specification}

{Constraints}
```

**使用场景：** 简单任务、能力强的模型（GPT-4、Claude）、定义良好的输出格式。

**风险：** 模型可能以与预期不同的方式解释任务（无示例时）。

---

## 少样本

在实际任务之前提供输入 → 输出对的示例。

```text
{Task instruction}

Example 1:
Input: {example input}
Output: {example output}

Example 2:
Input: {example input}
Output: {example output}

Now do the same for:
Input: {actual input}
Output:
```

**使用场景：** 模式跟随任务、分类、格式化、提取。

**指南：**

- 2-5 个示例为典型。更多不一定更好。
- 示例应覆盖预期的输入范围（不要全部相似）。
- 至少包含一个边界情况示例。
- 保持示例格式一致 —— 模型会模仿它所看到的。

---

## Chain-of-Thought（CoT / 思维链）

要求模型在给出最终答案之前逐步推理。

```text
{Task instruction}

Think through this step by step:
1. First, consider...
2. Then, analyze...
3. Finally, conclude...

{Input}
```

**使用场景：** 多步推理、数学、逻辑推导、复杂分析。

**变体：**

- **显式 CoT：** 在指令中加上"逐步思考"
- **少样本 CoT：** 示例包含推理步骤
- **零样本 CoT：** 仅附加"让我们逐步思考"（出乎意料地有效）

---

## 角色 / 身份

将模型设定为特定领域的专家。

```text
You are a {role} with expertise in {domain}. You have {years} of experience
with {specific skills}.

Your task is to {instruction}.

{Input}
```

**使用场景：** 领域特定任务，身份框架能提升输出质量。

**注意：** 身份应具体且相关，而非泛泛而谈。
"你是一名资深 PostgreSQL DBA" > "你是一个有用的助手。"

---

## 结构化输出

指定模型必须遵循的确切输出格式。

```
{Task instruction}

Respond in the following JSON format:
```json
{
  "field1": "description of what goes here",
  "field2": ["array", "of", "items"],
  "field3": {
    "nested": "object"
  }
}
```

{Input}
```

**使用场景：** 输出必须是机器可解析的（JSON、CSV、YAML）。

**增强：** 在可用时使用 JSON 模式 / 结构化输出 API 特性（OpenAI `response_format`、Anthropic 工具调用）。

---

## 分解

在提示中将复杂任务分解为明确的子任务。

```text

I need you to complete the following task in steps:

Step 1: {subtask 1}
Step 2: Using the result of Step 1, {subtask 2}
Step 3: Based on Steps 1 and 2, {subtask 3}

Present each step's result before moving to the next.

{Input}
```

**使用场景：** 从中间检查点受益的复杂任务。

---

## 基于约束

定义输出必须和不能包含的内容。

```text

{Task instruction}

Rules:

- MUST: {requirement 1}
- MUST: {requirement 2}
- MUST NOT: {prohibition 1}
- MUST NOT: {prohibition 2}
- IF {condition} THEN {behavior}

{Input}
```

**使用场景：** 有严格要求的任务或需要防止常见故障模式。

---

## 比较 / 选择模式

```text

Compare the following options and recommend the best one:

Option A: {description}
Option B: {description}

Evaluation criteria (in order of importance):

1. {criterion 1}
2. {criterion 2}
3. {criterion 3}

For each option, evaluate against each criterion. Then provide your recommendation
with justification.
```

---

## 模式选择指南

| 任务类型 | 推荐模式 | 后备方案 |
|-----------|-------------------|----------|
| 分类 | 少样本 | 在描述中包含示例的零样本 |
| 提取 | 少样本 + 结构化输出 | 带 JSON 模式的零样本 |
| 分析 | 思维链 | 分解 |
| 生成（创意） | 身份 + 约束 | 带语气指导的零样本 |
| 生成（技术） | 身份 + 结构化输出 | 少样本 + 模板 |
| 摘要 | 带长度约束的零样本 | 带长度示例的少样本 |
| 翻译/格式化 | 少样本 | 带格式规范的零样本 |
| 决策/推荐 | 比较模式 | 思维链 |
