## 适用场景

- 需要给生产环境 LLM 设计稳健 prompt，而不是临时试几句。
- 需要解决结构化输出、few-shot、角色设定、错误恢复、长上下文约束。
- 需要跑完整的 prompt 诊断与优化流程：拆出目标、失败模式、候选变体、评分标准、测试集。
- 相关资源：[assets/prompt-template-library.md](assets/prompt-template-library.md)、[assets/few-shot-examples.json](assets/few-shot-examples.json)、[scripts/optimize-prompt.mjs](scripts/optimize-prompt.mjs)。
- 系统化诊断参考文件：[references/prompt-patterns.md](references/prompt-patterns.md)、[references/evaluation-metrics.md](references/evaluation-metrics.md)、[references/failure-modes.md](references/failure-modes.md)、[references/output-constraints.md](references/output-constraints.md)。
- 相关 skill：[llm-evaluation](../llm-evaluation/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先明确输出契约，再写自然语言提示；没有 schema 的 prompt 很难稳定。
- few-shot 示例必须与真实任务同分布，示例越多不代表越好。
- Chain-of-thought 只在确实提升正确率时启用；不要把它当默认万能药。
- 变体实验必须结构化对比：一次只改一个主变量（指令清晰度、示例策略、输出约束）。
- 评分 rubric 必须包含硬约束和软约束，不要只有"感觉更好"。
- 如果问题本质在检索、数据或工具链，而不是 prompt，本 skill 只负责识别，不负责掩盖。

## 代码模式

### Schema 优先 + 简洁指令

```text
System: 你是分类器。只输出 JSON。
User: 根据工单返回 {category: "billing"|"bug"|"feature", priority: "low"|"med"|"high", reason: string}
Ticket: {content}
```

### 系统化诊断流程

当用户需要完整诊断（而不是只改一句 prompt）时，按以下结构展开：

```text
目标: 用户想让模型完成什么 / 什么结果算通过

当前问题: 错误类型 + 复现样例

候选变体:
- Variant A: 改输出约束
- Variant B: 改 few-shot
- Variant C: 改系统角色

评分维度:
- correctness: 0-5
- format_compliance: 0-5
- completeness: 0-5
- latency: observation only
```

### 按任务复杂度选粒度

- 小变更（如改输出格式）：直接给 1 行修改 + 验证命令
- 中等优化：3 个候选变体 + 简单 rubric
- 系统重构：完整诊断流程（目标→失败模式→变体矩阵→评分→测试集→实验计划）

## 检查清单

- 输出格式是否有明确 schema 或字段定义。
- 是否给了足够但不过量的示例（3-5 个：主路径 + 边界 + 易混淆反例）。
- prompt 是否包含边界条件、拒答规则、异常输入处理方式。
- 当前 prompt 的失败模式是否已经分类，而不是只收集了零散 bad case。
- 变体之间是否真正可比较（一次一变量）。
- 若要比较不同 prompt 版本，是否交给 [llm-evaluation](../llm-evaluation/SKILL.md) 建立回归基线。
- 如果 prompt 绑定 RAG，上下游检索问题是否已经交给 [rag-auditor](../rag-auditor/SKILL.md)。

## 反模式

### FAIL: 话术堆砌后临时补 JSON

```
"你是专业且聪明的助手，请认真分析，逻辑严密..."
[3000 字指令] 最后输出 JSON。
→ 模型 30% 概率输出 markdown + 偶尔 JSON
```

### PASS: Schema 优先 + 简洁指令

```
System: 你是分类器。只输出 JSON。
User: 根据工单返回 {category, priority, reason}
→ 结构化输出 + JSON schema 校验
```

### FAIL: 小问题大流程

```
用户："帮我把输出从 JSON 改成 YAML"
AI：[展开 5 阶段诊断 + 评测集 + 候选变体矩阵...]
→ 用户只想换一行
```

### PASS: 任务匹配深度（见上文"按任务复杂度选粒度"）

### FAIL: 同时改三个变量

```
v2 vs v1：改了 system prompt + 加了 5 个 few-shot + 换了输出 schema
→ 准确率 +12%，但不知道哪个起作用
```

### PASS: 一次一变量

```
v2 = v1 + 改 system prompt only → +5%
v3 = v2 + 加 few-shot only → +6%
v4 = v3 + 换 schema only → +1%
→ 知道每个变量贡献，可独立优化
```

### FAIL: 模型上限误判为 prompt 问题

```
小模型答错复杂数学 → "再写一版 prompt"
→ 试了 10 版 → 准确率天花板就是 30%
→ 真问题：换 reasoning model
```

### PASS: 先确认天花板

```
1. 用最强模型 + 最简 prompt 跑 baseline
2. baseline 也答不对 → 模型能力问题，换模型
3. baseline 对、当前模型错 → 才是 prompt 问题
```
