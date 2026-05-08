# 少样本学习指南

## 概述

少样本学习通过在提示中提供少量示例（通常 1-10 个），使 LLM 能够执行任务。此技术对于需要特定格式、风格或领域知识的任务非常有效。

## 示例选择策略

### 1. 语义相似度

选择与输入查询最相似的示例，使用基于嵌入的检索。

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class SemanticExampleSelector:
    def __init__(self, examples, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.examples = examples
        self.example_embeddings = self.model.encode([ex['input'] for ex in examples])

    def select(self, query, k=3):
        query_embedding = self.model.encode([query])
        similarities = np.dot(self.example_embeddings, query_embedding.T).flatten()
        top_indices = np.argsort(similarities)[-k:][::-1]
        return [self.examples[i] for i in top_indices]
```

**最适合**：问答、文本分类、提取任务

### 2. 多样性采样

最大化不同模式和边界情况的覆盖范围。

```python
from sklearn.cluster import KMeans

class DiversityExampleSelector:
    def __init__(self, examples, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.examples = examples
        self.embeddings = self.model.encode([ex['input'] for ex in examples])

    def select(self, k=5):
        # 使用 k-means 找到多样的聚类中心
        kmeans = KMeans(n_clusters=k, random_state=42)
        kmeans.fit(self.embeddings)

        # 选择最接近每个聚类中心的示例
        diverse_examples = []
        for center in kmeans.cluster_centers_:
            distances = np.linalg.norm(self.embeddings - center, axis=1)
            closest_idx = np.argmin(distances)
            diverse_examples.append(self.examples[closest_idx])

        return diverse_examples
```

**最适合**：展示任务多样性、边界情况处理

### 3. 基于难度选择

逐渐增加示例复杂度以搭建学习阶梯。

```python
class ProgressiveExampleSelector:
    def __init__(self, examples):
        # 示例应包含 'difficulty' 分数（0-1）
        self.examples = sorted(examples, key=lambda x: x['difficulty'])

    def select(self, k=3):
        # 选择难度线性增加的示例
        step = len(self.examples) // k
        return [self.examples[i * step] for i in range(k)]
```

**最适合**：复杂推理任务、代码生成

### 4. 基于错误选择

包含处理常见故障模式的示例。

```python
class ErrorGuidedSelector:
    def __init__(self, examples, error_patterns):
        self.examples = examples
        self.error_patterns = error_patterns  # 要避免的常见错误

    def select(self, query, k=3):
        # 选择展示错误模式正确处理的示例
        selected = []
        for pattern in self.error_patterns[:k]:
            matching = [ex for ex in self.examples if pattern in ex['demonstrates']]
            if matching:
                selected.append(matching[0])
        return selected
```

**最适合**：已知故障模式的任务、安全关键应用

## 示例构建最佳实践

### 格式一致性

所有示例应遵循相同的格式：

```python
# 好：一致格式
examples = [
    {
        "input": "What is the capital of France?",
        "output": "Paris"
    },
    {
        "input": "What is the capital of Germany?",
        "output": "Berlin"
    }
]

# 坏：不一致格式
examples = [
    "Q: What is the capital of France? A: Paris",
    {"question": "What is the capital of Germany?", "answer": "Berlin"}
]
```

### 输入-输出对齐

确保示例展示你希望模型执行的确切任务：

```python
# 好：清晰的输入-输出关系
example = {
    "input": "Sentiment: The movie was terrible and boring.",
    "output": "Negative"
}

# 坏：模糊的关系
example = {
    "input": "The movie was terrible and boring.",
    "output": "This review expresses negative sentiment toward the film."
}
```

### 复杂度平衡

包含覆盖预期难度范围的示例：

```python
examples = [
    # 简单情况
    {"input": "2 + 2", "output": "4"},

    # 中等情况
    {"input": "15 * 3 + 8", "output": "53"},

    # 复杂情况
    {"input": "(12 + 8) * 3 - 15 / 5", "output": "57"}
]
```

## 上下文窗口管理

### Token 预算分配

4K 上下文窗口的典型分布：

```
System Prompt:        500 tokens  (12%)
Few-Shot Examples:   1500 tokens  (38%)
User Input:           500 tokens  (12%)
Response:            1500 tokens  (38%)
```

### 动态示例截断

```python
class TokenAwareSelector:
    def __init__(self, examples, tokenizer, max_tokens=1500):
        self.examples = examples
        self.tokenizer = tokenizer
        self.max_tokens = max_tokens

    def select(self, query, k=5):
        selected = []
        total_tokens = 0

        # 从最相关的示例开始
        candidates = self.rank_by_relevance(query)

        for example in candidates[:k]:
            example_tokens = len(self.tokenizer.encode(
                f"Input: {example['input']}\nOutput: {example['output']}\n\n"
            ))

            if total_tokens + example_tokens <= self.max_tokens:
                selected.append(example)
                total_tokens += example_tokens
            else:
                break

        return selected
```

## 边界情况处理

### 包含边界示例

```python
edge_case_examples = [
    # 空输入
    {"input": "", "output": "Please provide input text."},

    # 非常长的输入（在示例中截断的）
    {"input": "..." + "word " * 1000, "output": "Input exceeds maximum length."},

    # 模糊输入
    {"input": "bank", "output": "Ambiguous: Could refer to financial institution or river bank."},

    # 无效输入
    {"input": "!@#$%", "output": "Invalid input format. Please provide valid text."}
]
```

## 少样本提示模板

### 分类模板

```python
def build_classification_prompt(examples, query, labels):
    prompt = f"Classify the text into one of these categories: {', '.join(labels)}\n\n"

    for ex in examples:
        prompt += f"Text: {ex['input']}\nCategory: {ex['output']}\n\n"

    prompt += f"Text: {query}\nCategory:"
    return prompt
```

### 提取模板

```python
def build_extraction_prompt(examples, query):
    prompt = "Extract structured information from the text.\n\n"

    for ex in examples:
        prompt += f"Text: {ex['input']}\nExtracted: {json.dumps(ex['output'])}\n\n"

    prompt += f"Text: {query}\nExtracted:"
    return prompt
```

### 转换模板

```python
def build_transformation_prompt(examples, query):
    prompt = "Transform the input according to the pattern shown in examples.\n\n"

    for ex in examples:
        prompt += f"Input: {ex['input']}\nOutput: {ex['output']}\n\n"

    prompt += f"Input: {query}\nOutput:"
    return prompt
```

## 评估与优化

### 示例质量指标

```python
def evaluate_example_quality(example, validation_set):
    metrics = {
        'clarity': rate_clarity(example),  # 0-1 分数
        'representativeness': calculate_similarity_to_validation(example, validation_set),
        'difficulty': estimate_difficulty(example),
        'uniqueness': calculate_uniqueness(example, other_examples)
    }
    return metrics
```

### A/B 测试示例集

```python
class ExampleSetTester:
    def __init__(self, llm_client):
        self.client = llm_client

    def compare_example_sets(self, set_a, set_b, test_queries):
        results_a = self.evaluate_set(set_a, test_queries)
        results_b = self.evaluate_set(set_b, test_queries)

        return {
            'set_a_accuracy': results_a['accuracy'],
            'set_b_accuracy': results_b['accuracy'],
            'winner': 'A' if results_a['accuracy'] > results_b['accuracy'] else 'B',
            'improvement': abs(results_a['accuracy'] - results_b['accuracy'])
        }

    def evaluate_set(self, examples, test_queries):
        correct = 0
        for query in test_queries:
            prompt = build_prompt(examples, query['input'])
            response = self.client.complete(prompt)
            if response == query['expected_output']:
                correct += 1
        return {'accuracy': correct / len(test_queries)}
```

## 高级技巧

### 元学习（学会选择）

训练一个小模型来预测哪些示例最有效：

```python
from sklearn.ensemble import RandomForestClassifier

class LearnedExampleSelector:
    def __init__(self):
        self.selector_model = RandomForestClassifier()

    def train(self, training_data):
        # training_data: (query, example, success) 元组列表
        features = []
        labels = []

        for query, example, success in training_data:
            features.append(self.extract_features(query, example))
            labels.append(1 if success else 0)

        self.selector_model.fit(features, labels)

    def extract_features(self, query, example):
        return [
            semantic_similarity(query, example['input']),
            len(example['input']),
            len(example['output']),
            keyword_overlap(query, example['input'])
        ]

    def select(self, query, candidates, k=3):
        scores = []
        for example in candidates:
            features = self.extract_features(query, example)
            score = self.selector_model.predict_proba([features])[0][1]
            scores.append((score, example))

        return [ex for _, ex in sorted(scores, reverse=True)[:k]]
```

### 自适应示例数量

根据任务难度动态调整示例数量：

```python
class AdaptiveExampleSelector:
    def __init__(self, examples):
        self.examples = examples

    def select(self, query, max_examples=5):
        # 从 1 个示例开始
        for k in range(1, max_examples + 1):
            selected = self.get_top_k(query, k)

            # 快速置信度检查（可用轻量模型）
            if self.estimated_confidence(query, selected) > 0.9:
                return selected

        return selected  # 如果从未达到足够置信度，返回最大示例数
```

## 常见错误

1. **示例过多**：多不一定好；可能稀释焦点
2. **不相关的示例**：示例应与目标任务紧密匹配
3. **格式不一致**：使模型对输出格式感到困惑
4. **过拟合示例**：模型过于字面地复制示例模式
5. **忽略 Token 限制**：实际输入/输出的空间不足

## 资源

- 示例数据集仓库
- 常见任务的预构建示例选择器
- 少样本性能评估框架
- 不同模型的 Token 计数工具
