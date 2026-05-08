# 提示模板系统

## 模板架构

### 基础模板结构

```python
class PromptTemplate:
    def __init__(self, template_string, variables=None):
        self.template = template_string
        self.variables = variables or []

    def render(self, **kwargs):
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            raise ValueError(f"Missing required variables: {missing}")

        return self.template.format(**kwargs)

# 使用
template = PromptTemplate(
    template_string="Translate {text} from {source_lang} to {target_lang}",
    variables=['text', 'source_lang', 'target_lang']
)

prompt = template.render(
    text="Hello world",
    source_lang="English",
    target_lang="Spanish"
)
```

### 条件模板

```python
class ConditionalTemplate(PromptTemplate):
    def render(self, **kwargs):
        # 处理条件块
        result = self.template

        # 处理 if 块：{{#if variable}}content{{/if}}
        import re
        if_pattern = r'\{\{#if (\w+)\}\}(.*?)\{\{/if\}\}'

        def replace_if(match):
            var_name = match.group(1)
            content = match.group(2)
            return content if kwargs.get(var_name) else ''

        result = re.sub(if_pattern, replace_if, result, flags=re.DOTALL)

        # 处理 for 循环：{{#each items}}{{this}}{{/each}}
        each_pattern = r'\{\{#each (\w+)\}\}(.*?)\{\{/each\}\}'

        def replace_each(match):
            var_name = match.group(1)
            content = match.group(2)
            items = kwargs.get(var_name, [])
            return '\n'.join(content.replace('{{this}}', str(item)) for item in items)

        result = re.sub(each_pattern, replace_each, result, flags=re.DOTALL)

        # 最后，渲染剩余变量
        return result.format(**kwargs)

# 使用
template = ConditionalTemplate("""
Analyze the following text:
{text}

{{#if include_sentiment}}
Provide sentiment analysis.
{{/if}}

{{#if include_entities}}
Extract named entities.
{{/if}}

{{#if examples}}
Reference examples:
{{#each examples}}
- {{this}}
{{/each}}
{{/if}}
""")
```

### 模块化模板组合

```python
class ModularTemplate:
    def __init__(self):
        self.components = {}

    def register_component(self, name, template):
        self.components[name] = template

    def render(self, structure, **kwargs):
        parts = []
        for component_name in structure:
            if component_name in self.components:
                component = self.components[component_name]
                parts.append(component.format(**kwargs))

        return '\n\n'.join(parts)

# 使用
builder = ModularTemplate()

builder.register_component('system', "You are a {role}.")
builder.register_component('context', "Context: {context}")
builder.register_component('instruction', "Task: {task}")
builder.register_component('examples', "Examples:\n{examples}")
builder.register_component('input', "Input: {input}")
builder.register_component('format', "Output format: {format}")

# 为不同场景组合不同模板
basic_prompt = builder.render(
    ['system', 'instruction', 'input'],
    role='helpful assistant',
    instruction='Summarize the text',
    input='...'
)

advanced_prompt = builder.render(
    ['system', 'context', 'examples', 'instruction', 'input', 'format'],
    role='expert analyst',
    context='Financial analysis',
    examples='...',
    instruction='Analyze sentiment',
    input='...',
    format='JSON'
)
```

## 常见模板模式

### 分类模板

```python
CLASSIFICATION_TEMPLATE = """
Classify the following {content_type} into one of these categories: {categories}

{{#if description}}
Category descriptions:
{description}
{{/if}}

{{#if examples}}
Examples:
{examples}
{{/if}}

{content_type}: {input}

Category:"""
```

### 提取模板

```python
EXTRACTION_TEMPLATE = """
Extract structured information from the {content_type}.

Required fields:
{field_definitions}

{{#if examples}}
Example extraction:
{examples}
{{/if}}

{content_type}: {input}

Extracted information (JSON):"""
```

### 生成模板

```python
GENERATION_TEMPLATE = """
Generate {output_type} based on the following {input_type}.

Requirements:
{requirements}

{{#if style}}
Style: {style}
{{/if}}

{{#if constraints}}
Constraints:
{constraints}
{{/if}}

{{#if examples}}
Examples:
{examples}
{{/if}}

{input_type}: {input}

{output_type}:"""
```

### 转换模板

```python
TRANSFORMATION_TEMPLATE = """
Transform the input {source_format} to {target_format}.

Transformation rules:
{rules}

{{#if examples}}
Example transformations:
{examples}
{{/if}}

Input {source_format}:
{input}

Output {target_format}:"""
```

## 高级特性

### 模板继承

```python
class TemplateRegistry:
    def __init__(self):
        self.templates = {}

    def register(self, name, template, parent=None):
        if parent and parent in self.templates:
            # 从父模板继承
            base = self.templates[parent]
            template = self.merge_templates(base, template)

        self.templates[name] = template

    def merge_templates(self, parent, child):
        # 子模板覆盖父模板的节
        return {**parent, **child}

# 使用
registry = TemplateRegistry()

registry.register('base_analysis', {
    'system': 'You are an expert analyst.',
    'format': 'Provide analysis in structured format.'
})

registry.register('sentiment_analysis', {
    'instruction': 'Analyze sentiment',
    'format': 'Provide sentiment score from -1 to 1.'
}, parent='base_analysis')
```

### 变量验证

```python
class ValidatedTemplate:
    def __init__(self, template, schema):
        self.template = template
        self.schema = schema

    def validate_vars(self, **kwargs):
        for var_name, var_schema in self.schema.items():
            if var_name in kwargs:
                value = kwargs[var_name]

                # 类型验证
                if 'type' in var_schema:
                    expected_type = var_schema['type']
                    if not isinstance(value, expected_type):
                        raise TypeError(f"{var_name} must be {expected_type}")

                # 范围验证
                if 'min' in var_schema and value < var_schema['min']:
                    raise ValueError(f"{var_name} must be >= {var_schema['min']}")

                if 'max' in var_schema and value > var_schema['max']:
                    raise ValueError(f"{var_name} must be <= {var_schema['max']}")

                # 枚举验证
                if 'choices' in var_schema and value not in var_schema['choices']:
                    raise ValueError(f"{var_name} must be one of {var_schema['choices']}")

    def render(self, **kwargs):
        self.validate_vars(**kwargs)
        return self.template.format(**kwargs)

# 使用
template = ValidatedTemplate(
    template="Summarize in {length} words with {tone} tone",
    schema={
        'length': {'type': int, 'min': 10, 'max': 500},
        'tone': {'type': str, 'choices': ['formal', 'casual', 'technical']}
    }
)
```

### 模板缓存

```python
class CachedTemplate:
    def __init__(self, template):
        self.template = template
        self.cache = {}

    def render(self, use_cache=True, **kwargs):
        if use_cache:
            cache_key = self.get_cache_key(kwargs)
            if cache_key in self.cache:
                return self.cache[cache_key]

        result = self.template.format(**kwargs)

        if use_cache:
            self.cache[cache_key] = result

        return result

    def get_cache_key(self, kwargs):
        return hash(frozenset(kwargs.items()))

    def clear_cache(self):
        self.cache = {}
```

## 多轮模板

### 对话模板

```python
class ConversationTemplate:
    def __init__(self, system_prompt):
        self.system_prompt = system_prompt
        self.history = []

    def add_user_message(self, message):
        self.history.append({'role': 'user', 'content': message})

    def add_assistant_message(self, message):
        self.history.append({'role': 'assistant', 'content': message})

    def render_for_api(self):
        messages = [{'role': 'system', 'content': self.system_prompt}]
        messages.extend(self.history)
        return messages

    def render_as_text(self):
        result = f"System: {self.system_prompt}\n\n"
        for msg in self.history:
            role = msg['role'].capitalize()
            result += f"{role}: {msg['content']}\n\n"
        return result
```

### 基于状态的模板

```python
class StatefulTemplate:
    def __init__(self):
        self.state = {}
        self.templates = {}

    def set_state(self, **kwargs):
        self.state.update(kwargs)

    def register_state_template(self, state_name, template):
        self.templates[state_name] = template

    def render(self):
        current_state = self.state.get('current_state', 'default')
        template = self.templates.get(current_state)

        if not template:
            raise ValueError(f"No template for state: {current_state}")

        return template.format(**self.state)

# 多步工作流的使用
workflow = StatefulTemplate()

workflow.register_state_template('init', """
Welcome! Let's {task}.
What is your {first_input}?
""")

workflow.register_state_template('processing', """
Thanks! Processing {first_input}.
Now, what is your {second_input}?
""")

workflow.register_state_template('complete', """
Great! Based on:
- {first_input}
- {second_input}

Here's the result: {result}
""")
```

## 最佳实践

1. **保持 DRY**：使用模板避免重复
2. **尽早验证**：在渲染前检查变量
3. **版本化模板**：像代码一样追踪变更
4. **测试变体**：确保模板能处理不同的输入
5. **文档化变量**：清晰指定必需/可选变量
6. **使用类型提示**：使变量类型明确
7. **提供默认值**：在适当处设置合理的默认值
8. **明智缓存**：缓存静态模板，而非动态模板

## 模板库

### 问答

```python
QA_TEMPLATES = {
    'factual': """Answer the question based on the context.

Context: {context}
Question: {question}
Answer:""",

    'multi_hop': """Answer the question by reasoning across multiple facts.

Facts: {facts}
Question: {question}

Reasoning:""",

    'conversational': """Continue the conversation naturally.

Previous conversation:
{history}

User: {question}
Assistant:"""
}
```

### 内容生成

```python
GENERATION_TEMPLATES = {
    'blog_post': """Write a blog post about {topic}.

Requirements:
- Length: {word_count} words
- Tone: {tone}
- Include: {key_points}

Blog post:""",

    'product_description': """Write a product description for {product}.

Features: {features}
Benefits: {benefits}
Target audience: {audience}

Description:""",

    'email': """Write a {type} email.

To: {recipient}
Context: {context}
Key points: {key_points}

Email:"""
}
```

## 性能考量

- 预编译模板以供重复使用
- 变量静态时缓存已渲染的模板
- 最小化循环中的字符串拼接
- 使用高效的字符串格式化（f-strings、.format()）
- 分析模板渲染以发现瓶颈
