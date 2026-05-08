# 输出约束

约束 LLM 输出格式、强制结构并确保可解析响应的技术。

---

## 提示级约束

### 长度约束

```text
Respond in exactly 3 bullet points.
Maximum 100 words.
One sentence only.
Between 2 and 5 paragraphs.
```

### 格式约束

```text
Respond in valid JSON matching this schema:
{"category": "string", "confidence": "number 0-1", "reasoning": "string"}

Respond as a markdown table with columns: Feature, Pros, Cons

Respond as a numbered list. Each item must start with an action verb.
```

### 内容约束

```text
ONLY use information from the provided context. Do not add external knowledge.
If the answer is not in the context, respond with "Not found in context."
Do not include opinions or recommendations. State facts only.
Do not use technical jargon. Write for a non-technical audience.
```

---

## API 级约束

### JSON 模式（OpenAI）

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=[...],
    response_format={"type": "json_object"},
)
```

保证有效的 JSON 输出。仍需要在提示中指定 schema。

### 工具调用 / 函数调用（Claude、OpenAI）

```python
# 将预期输出 schema 定义为工具
tools = [{
    "name": "classify_ticket",
    "description": "Classify a support ticket",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {"type": "string", "enum": ["billing", "technical", "general"]},
            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
            "summary": {"type": "string"},
        },
        "required": ["category", "priority", "summary"],
    },
}]
```

强制模型响应符合 schema 的结构化对象。

### 结构化输出（OpenAI）

```python
from pydantic import BaseModel

class Classification(BaseModel):
    category: str
    confidence: float
    reasoning: str

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[...],
    response_format=Classification,
)
```

---

## 约束定位

### 位置很重要

模型有近因偏差 —— 提示末尾的指令比开头的更可靠地被遵循。

```text
{Context / input data}

{Main instruction}

{Format constraint — place last for best compliance}
```

### 重复加强

对于关键约束，声明两次：

```text
Important: Respond ONLY in valid JSON.

{Task instruction}

{Input}

Remember: Your response must be valid JSON. No text outside the JSON object.
```

---

## 常见约束失败

| 约束 | 故障模式 | 修复 |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| "以 JSON 格式响应" | 模型将 JSON 包裹在 markdown 代码块中 | "仅输出原始 JSON。无 markdown，无代码块。" |
| "最多 3 句话" | 模型写了 3 个长句 | "最多 3 句话，每句不超过 30 词" |
| "仅使用提供的上下文" | 模型添加了常识 | "如果你添加了任何不在上下文中的信息，请标记为 [推断]" |
| "无观点" | 模型用"有人可能会说"来回避 | "将每个点作为事实性观察陈述" |
| "使用此模板" | 模型修改了模板结构 | 提供带清晰标记的模板：`{FILL THIS}` |

---

## 生成后验证

即使有约束，也要以编程方式验证输出：

```python
import json

def validate_output(text: str, expected_keys: list[str]) -> bool:
    """验证输出是否为带有预期键的有效 JSON。"""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return False

    return all(key in data for key in expected_keys)
```

### 重试策略

如果验证失败：

1. 解析错误
2. 在后续提示中包含错误
3. 要求模型修复其输出
4. 最多重试 2 次，之后失败

```python
for attempt in range(3):
    response = generate(prompt)
    if validate_output(response):
        return response
    prompt = f"Your previous response was invalid: {error}. Please fix it.\n\n{original_prompt}"
raise ValueError("Failed to generate valid output after 3 attempts")
```
