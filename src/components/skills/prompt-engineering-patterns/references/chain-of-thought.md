# Chain-of-Thought（思维链）提示

## 概述

Chain-of-Thought（CoT）提示引导 LLM 进行逐步推理，显著提高在复杂推理、数学和逻辑任务上的表现。

## 核心技巧

### 零样本 CoT

添加简单的触发短语以引发推理：

```python
def zero_shot_cot(query):
    return f"""{query}

Let's think step by step:"""

# 示例
query = "If a train travels 60 mph for 2.5 hours, how far does it go?"
prompt = zero_shot_cot(query)

# 模型输出：
# "Let's think step by step:
# 1. Speed = 60 miles per hour
# 2. Time = 2.5 hours
# 3. Distance = Speed × Time
# 4. Distance = 60 × 2.5 = 150 miles
# Answer: 150 miles"
```

### 少样本 CoT

提供带有显式推理链的示例：

```python
few_shot_examples = """
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 balls. How many tennis balls does he have now?
A: Let's think step by step:
1. Roger starts with 5 balls
2. He buys 2 cans, each with 3 balls
3. Balls from cans: 2 × 3 = 6 balls
4. Total: 5 + 6 = 11 balls
Answer: 11

Q: The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many do they have?
A: Let's think step by step:
1. Started with 23 apples
2. Used 20 for lunch: 23 - 20 = 3 apples left
3. Bought 6 more: 3 + 6 = 9 apples
Answer: 9

Q: {user_query}
A: Let's think step by step:"""
```

### 自洽性

生成多个推理路径并采用多数投票：

```python
import openai
from collections import Counter

def self_consistency_cot(query, n=5, temperature=0.7):
    prompt = f"{query}\n\nLet's think step by step:"

    responses = []
    for _ in range(n):
        response = openai.ChatCompletion.create(
            model="gpt-5.2",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        responses.append(extract_final_answer(response))

    # 采用多数投票
    answer_counts = Counter(responses)
    final_answer = answer_counts.most_common(1)[0][0]

    return {
        'answer': final_answer,
        'confidence': answer_counts[final_answer] / n,
        'all_responses': responses
    }
```

## 高级模式

### 由易到难提示

将复杂问题分解为更简单的子问题：

```python
def least_to_most_prompt(complex_query):
    # 阶段 1：分解
    decomp_prompt = f"""Break down this complex problem into simpler subproblems:

Problem: {complex_query}

Subproblems:"""

    subproblems = get_llm_response(decomp_prompt)

    # 阶段 2：顺序求解
    solutions = []
    context = ""

    for subproblem in subproblems:
        solve_prompt = f"""{context}

Solve this subproblem:
{subproblem}

Solution:"""
        solution = get_llm_response(solve_prompt)
        solutions.append(solution)
        context += f"\n\nPreviously solved: {subproblem}\nSolution: {solution}"

    # 阶段 3：最终整合
    final_prompt = f"""Given these solutions to subproblems:
{context}

Provide the final answer to: {complex_query}

Final Answer:"""

    return get_llm_response(final_prompt)
```

### 思维树（ToT）

探索多个推理分支：

```python
class TreeOfThought:
    def __init__(self, llm_client, max_depth=3, branches_per_step=3):
        self.client = llm_client
        self.max_depth = max_depth
        self.branches_per_step = branches_per_step

    def solve(self, problem):
        # 生成初始思维分支
        initial_thoughts = self.generate_thoughts(problem, depth=0)

        # 评估每个分支
        best_path = None
        best_score = -1

        for thought in initial_thoughts:
            path, score = self.explore_branch(problem, thought, depth=1)
            if score > best_score:
                best_score = score
                best_path = path

        return best_path

    def generate_thoughts(self, problem, context="", depth=0):
        prompt = f"""Problem: {problem}
{context}

Generate {self.branches_per_step} different next steps in solving this problem:

1."""
        response = self.client.complete(prompt)
        return self.parse_thoughts(response)

    def evaluate_thought(self, problem, thought_path):
        prompt = f"""Problem: {problem}

Reasoning path so far:
{thought_path}

Rate this reasoning path from 0-10 for:
- Correctness
- Likelihood of reaching solution
- Logical coherence

Score:"""
        return float(self.client.complete(prompt))
```

### 验证步骤

添加显式验证以捕获错误：

```python
def cot_with_verification(query):
    # 步骤 1：生成推理和答案
    reasoning_prompt = f"""{query}

Let's solve this step by step:"""

    reasoning_response = get_llm_response(reasoning_prompt)

    # 步骤 2：验证推理
    verification_prompt = f"""Original problem: {query}

Proposed solution:
{reasoning_response}

Verify this solution by:
1. Checking each step for logical errors
2. Verifying arithmetic calculations
3. Ensuring the final answer makes sense

Is this solution correct? If not, what's wrong?

Verification:"""

    verification = get_llm_response(verification_prompt)

    # 步骤 3：必要时修改
    if "incorrect" in verification.lower() or "error" in verification.lower():
        revision_prompt = f"""The previous solution had errors:
{verification}

Please provide a corrected solution to: {query}

Corrected solution:"""
        return get_llm_response(revision_prompt)

    return reasoning_response
```

## 领域特定 CoT

### 数学问题

```python
math_cot_template = """
Problem: {problem}

Solution:
Step 1: Identify what we know
- {list_known_values}

Step 2: Identify what we need to find
- {target_variable}

Step 3: Choose relevant formulas
- {formulas}

Step 4: Substitute values
- {substitution}

Step 5: Calculate
- {calculation}

Step 6: Verify and state answer
- {verification}

Answer: {final_answer}
"""
```

### 代码调试

```python
debug_cot_template = """
Code with error:
{code}

Error message:
{error}

Debugging process:
Step 1: Understand the error message
- {interpret_error}

Step 2: Locate the problematic line
- {identify_line}

Step 3: Analyze why this line fails
- {root_cause}

Step 4: Determine the fix
- {proposed_fix}

Step 5: Verify the fix addresses the error
- {verification}

Fixed code:
{corrected_code}
"""
```

### 逻辑推理

```python
logic_cot_template = """
Premises:
{premises}

Question: {question}

Reasoning:
Step 1: List all given facts
{facts}

Step 2: Identify logical relationships
{relationships}

Step 3: Apply deductive reasoning
{deductions}

Step 4: Draw conclusion
{conclusion}

Answer: {final_answer}
"""
```

## 性能优化

### 缓存推理模式

```python
class ReasoningCache:
    def __init__(self):
        self.cache = {}

    def get_similar_reasoning(self, problem, threshold=0.85):
        problem_embedding = embed(problem)

        for cached_problem, reasoning in self.cache.items():
            similarity = cosine_similarity(
                problem_embedding,
                embed(cached_problem)
            )
            if similarity > threshold:
                return reasoning

        return None

    def add_reasoning(self, problem, reasoning):
        self.cache[problem] = reasoning
```

### 自适应推理深度

```python
def adaptive_cot(problem, initial_depth=3):
    depth = initial_depth

    while depth <= 10:  # 最大深度
        response = generate_cot(problem, num_steps=depth)

        # 检查解是否看起来完整
        if is_solution_complete(response):
            return response

        depth += 2  # 增加推理深度

    return response  # 返回最佳尝试
```

## 评估指标

```python
def evaluate_cot_quality(reasoning_chain):
    metrics = {
        'coherence': measure_logical_coherence(reasoning_chain),
        'completeness': check_all_steps_present(reasoning_chain),
        'correctness': verify_final_answer(reasoning_chain),
        'efficiency': count_unnecessary_steps(reasoning_chain),
        'clarity': rate_explanation_clarity(reasoning_chain)
    }
    return metrics
```

## 最佳实践

1. **清晰的步骤标记**：使用编号步骤或明确的分隔符
2. **展示所有过程**：不跳过步骤，即使是显而易见的
3. **验证计算**：添加显式的验证步骤
4. **陈述假设**：将隐含假设变为显式
5. **检查边界情况**：考虑边界条件
6. **使用示例**：先用示例展示推理模式

## 常见陷阱

- **过早结论**：未完成完整推理就跳到答案
- **循环逻辑**：用结论来证明推理
- **缺少步骤**：跳过中间计算
- **过度复杂化**：添加不必要的步骤造成混淆
- **格式不一致**：在推理中途更改步骤结构

## 何时使用 CoT

**使用 CoT 的场景：**

- 数学和算术问题
- 逻辑推理任务
- 多步骤规划
- 代码生成和调试
- 复杂决策

**跳过 CoT 的场景：**

- 简单的事实性查询
- 直接查找
- 创意写作
- 需要简洁的任务
- 实时、延迟敏感的应用

## 资源

- CoT 评估的基准数据集
- 预构建的 CoT 提示模板
- 推理验证工具
- 步骤提取和解析工具
