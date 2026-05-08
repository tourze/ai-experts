# 提示优化指南

## 系统化优化流程

### 1. 建立基线

```python
def establish_baseline(prompt, test_cases):
    results = {
        'accuracy': 0,
        'avg_tokens': 0,
        'avg_latency': 0,
        'success_rate': 0
    }

    for test_case in test_cases:
        response = llm.complete(prompt.format(**test_case['input']))

        results['accuracy'] += evaluate_accuracy(response, test_case['expected'])
        results['avg_tokens'] += count_tokens(response)
        results['avg_latency'] += measure_latency(response)
        results['success_rate'] += is_valid_response(response)

    # 求测试用例的平均值
    n = len(test_cases)
    return {k: v/n for k, v in results.items()}
```

### 2. 迭代优化工作流

```
Initial Prompt → Test → Analyze Failures → Refine → Test → Repeat
```

```python
class PromptOptimizer:
    def __init__(self, initial_prompt, test_suite):
        self.prompt = initial_prompt
        self.test_suite = test_suite
        self.history = []

    def optimize(self, max_iterations=10):
        for i in range(max_iterations):
            # 测试当前提示
            results = self.evaluate_prompt(self.prompt)
            self.history.append({
                'iteration': i,
                'prompt': self.prompt,
                'results': results
            })

            # 如果足够好就停止
            if results['accuracy'] > 0.95:
                break

            # 分析失败
            failures = self.analyze_failures(results)

            # 生成优化建议
            refinements = self.generate_refinements(failures)

            # 应用最佳优化
            self.prompt = self.select_best_refinement(refinements)

        return self.get_best_prompt()
```

### 3. A/B 测试框架

```python
class PromptABTest:
    def __init__(self, variant_a, variant_b):
        self.variant_a = variant_a
        self.variant_b = variant_b

    def run_test(self, test_queries, metrics=['accuracy', 'latency']):
        results = {
            'A': {m: [] for m in metrics},
            'B': {m: [] for m in metrics}
        }

        for query in test_queries:
            # 随机分配变体（50/50 分配）
            variant = 'A' if random.random() < 0.5 else 'B'
            prompt = self.variant_a if variant == 'A' else self.variant_b

            response, metrics_data = self.execute_with_metrics(
                prompt.format(query=query['input'])
            )

            for metric in metrics:
                results[variant][metric].append(metrics_data[metric])

        return self.analyze_results(results)

    def analyze_results(self, results):
        from scipy import stats

        analysis = {}
        for metric in results['A'].keys():
            a_values = results['A'][metric]
            b_values = results['B'][metric]

            # 统计显著性检验
            t_stat, p_value = stats.ttest_ind(a_values, b_values)

            analysis[metric] = {
                'A_mean': np.mean(a_values),
                'B_mean': np.mean(b_values),
                'improvement': (np.mean(b_values) - np.mean(a_values)) / np.mean(a_values),
                'statistically_significant': p_value < 0.05,
                'p_value': p_value,
                'winner': 'B' if np.mean(b_values) > np.mean(a_values) else 'A'
            }

        return analysis
```

## 优化策略

### Token 缩减

```python
def optimize_for_tokens(prompt):
    optimizations = [
        # 移除冗余短语
        ('in order to', 'to'),
        ('due to the fact that', 'because'),
        ('at this point in time', 'now'),

        # 合并指令
        ('First, ...\nThen, ...\nFinally, ...', 'Steps: 1) ... 2) ... 3) ...'),

        # 使用缩写（首次定义后）
        ('Natural Language Processing (NLP)', 'NLP'),

        # 移除填充词
        (' actually ', ' '),
        (' basically ', ' '),
        (' really ', ' ')
    ]

    optimized = prompt
    for old, new in optimizations:
        optimized = optimized.replace(old, new)

    return optimized
```

### 延迟降低

```python
def optimize_for_latency(prompt):
    strategies = {
        'shorter_prompt': reduce_token_count(prompt),
        'streaming': enable_streaming_response(prompt),
        'caching': add_cacheable_prefix(prompt),
        'early_stopping': add_stop_sequences(prompt)
    }

    # 测试每个策略
    best_strategy = None
    best_latency = float('inf')

    for name, modified_prompt in strategies.items():
        latency = measure_average_latency(modified_prompt)
        if latency < best_latency:
            best_latency = latency
            best_strategy = modified_prompt

    return best_strategy
```

### 准确性提升

```python
def improve_accuracy(prompt, failure_cases):
    improvements = []

    # 为常见失败添加约束
    if has_format_errors(failure_cases):
        improvements.append("Output must be valid JSON with no additional text.")

    # 为边界情况添加示例
    edge_cases = identify_edge_cases(failure_cases)
    if edge_cases:
        improvements.append(f"Examples of edge cases:\n{format_examples(edge_cases)}")

    # 添加验证步骤
    if has_logical_errors(failure_cases):
        improvements.append("Before responding, verify your answer is logically consistent.")

    # 加强指令
    if has_ambiguity_errors(failure_cases):
        improvements.append(clarify_ambiguous_instructions(prompt))

    return integrate_improvements(prompt, improvements)
```

## 性能指标

### 核心指标

```python
class PromptMetrics:
    @staticmethod
    def accuracy(responses, ground_truth):
        return sum(r == gt for r, gt in zip(responses, ground_truth)) / len(responses)

    @staticmethod
    def consistency(responses):
        # 衡量相同输入产生相同输出的频率
        from collections import defaultdict
        input_responses = defaultdict(list)

        for inp, resp in responses:
            input_responses[inp].append(resp)

        consistency_scores = []
        for inp, resps in input_responses.items():
            if len(resps) > 1:
                # 匹配最常见响应的响应百分比
                most_common_count = Counter(resps).most_common(1)[0][1]
                consistency_scores.append(most_common_count / len(resps))

        return np.mean(consistency_scores) if consistency_scores else 1.0

    @staticmethod
    def token_efficiency(prompt, responses):
        avg_prompt_tokens = np.mean([count_tokens(prompt.format(**r['input'])) for r in responses])
        avg_response_tokens = np.mean([count_tokens(r['output']) for r in responses])
        return avg_prompt_tokens + avg_response_tokens

    @staticmethod
    def latency_p95(latencies):
        return np.percentile(latencies, 95)
```

### 自动评估

```python
def evaluate_prompt_comprehensively(prompt, test_suite):
    results = {
        'accuracy': [],
        'consistency': [],
        'latency': [],
        'tokens': [],
        'success_rate': []
    }

    # 对每个测试用例多次运行以测量一致性
    for test_case in test_suite:
        runs = []
        for _ in range(3):  # 每个测试用例 3 次运行
            start = time.time()
            response = llm.complete(prompt.format(**test_case['input']))
            latency = time.time() - start

            runs.append(response)
            results['latency'].append(latency)
            results['tokens'].append(count_tokens(prompt) + count_tokens(response))

        # 准确性（3 次运行中的最佳）
        accuracies = [evaluate_accuracy(r, test_case['expected']) for r in runs]
        results['accuracy'].append(max(accuracies))

        # 一致性（3 次运行的相似度）
        results['consistency'].append(calculate_similarity(runs))

        # 成功率（所有运行都成功？）
        results['success_rate'].append(all(is_valid(r) for r in runs))

    return {
        'avg_accuracy': np.mean(results['accuracy']),
        'avg_consistency': np.mean(results['consistency']),
        'p95_latency': np.percentile(results['latency'], 95),
        'avg_tokens': np.mean(results['tokens']),
        'success_rate': np.mean(results['success_rate'])
    }
```

## 失败分析

### 失败分类

```python
class FailureAnalyzer:
    def categorize_failures(self, test_results):
        categories = {
            'format_errors': [],
            'factual_errors': [],
            'logic_errors': [],
            'incomplete_responses': [],
            'hallucinations': [],
            'off_topic': []
        }

        for result in test_results:
            if not result['success']:
                category = self.determine_failure_type(
                    result['response'],
                    result['expected']
                )
                categories[category].append(result)

        return categories

    def generate_fixes(self, categorized_failures):
        fixes = []

        if categorized_failures['format_errors']:
            fixes.append({
                'issue': 'Format errors',
                'fix': 'Add explicit format examples and constraints',
                'priority': 'high'
            })

        if categorized_failures['hallucinations']:
            fixes.append({
                'issue': 'Hallucinations',
                'fix': 'Add grounding instruction: "Base your answer only on provided context"',
                'priority': 'critical'
            })

        if categorized_failures['incomplete_responses']:
            fixes.append({
                'issue': 'Incomplete responses',
                'fix': 'Add: "Ensure your response fully addresses all parts of the question"',
                'priority': 'medium'
            })

        return fixes
```

## 版本控制和回滚

### 提示版本控制

```python
class PromptVersionControl:
    def __init__(self, storage_path):
        self.storage = storage_path
        self.versions = []

    def save_version(self, prompt, metadata):
        version = {
            'id': len(self.versions),
            'prompt': prompt,
            'timestamp': datetime.now(),
            'metrics': metadata.get('metrics', {}),
            'description': metadata.get('description', ''),
            'parent_id': metadata.get('parent_id')
        }
        self.versions.append(version)
        self.persist()
        return version['id']

    def rollback(self, version_id):
        if version_id < len(self.versions):
            return self.versions[version_id]['prompt']
        raise ValueError(f"Version {version_id} not found")

    def compare_versions(self, v1_id, v2_id):
        v1 = self.versions[v1_id]
        v2 = self.versions[v2_id]

        return {
            'diff': generate_diff(v1['prompt'], v2['prompt']),
            'metrics_comparison': {
                metric: {
                    'v1': v1['metrics'].get(metric),
                    'v2': v2['metrics'].get(metric),
                    'change': v2['metrics'].get(metric, 0) - v1['metrics'].get(metric, 0)
                }
                for metric in set(v1['metrics'].keys()) | set(v2['metrics'].keys())
            }
        }
```

## 最佳实践

1. **建立基线**：始终测量初始性能
2. **一次只改一处**：隔离变量以明确归因
3. **彻底测试**：使用多样化、有代表性的测试用例
4. **追踪指标**：记录所有实验和结果
5. **验证显著性**：对 A/B 比较使用统计检验
6. **记录变更**：详细记录变更内容及原因
7. **全量版本控制**：启用回滚到先前版本
8. **监控生产环境**：持续评估已部署的提示

## 常见优化模式

### 模式 1：添加结构

```
Before: "Analyze this text"
After: "Analyze this text for:\n1. Main topic\n2. Key arguments\n3. Conclusion"
```

### 模式 2：添加示例

```
Before: "Extract entities"
After: "Extract entities\n\nExample:\nText: Apple released iPhone\nEntities: {company: Apple, product: iPhone}"
```

### 模式 3：添加约束

```
Before: "Summarize this"
After: "Summarize in exactly 3 bullet points, 15 words each"
```

### 模式 4：添加验证

```
Before: "Calculate..."
After: "Calculate... Then verify your calculation is correct before responding."
```

## 工具和实用程序

- 用于版本比较的提示差异工具
- 自动化测试运行器
- 指标仪表板
- A/B 测试框架
- Token 计数工具
- 延迟分析器
