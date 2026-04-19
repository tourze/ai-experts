# 两阶段 AI 分类

用于 `auto` 模式下，规则未命中的歧义场景。

## Phase A — 快速分类器（启发式）

- 关键词匹配、正则模式、结构分析
- 微秒级，进程内执行
- 处理 80%+ 场景（明确的 allow 和明确的 deny）
- 歧义场景返回 `uncertain`

```python
class FastClassifier:
    DENY_PATTERNS = [
        r"rm\s+-rf\s+/(?!tmp)",    # rm -rf 非 tmp 目录
        r"curl.*\|\s*(?:ba)?sh",    # curl pipe to shell
        r"DROP\s+(?:TABLE|DATABASE)", # SQL 删除
    ]
    ALLOW_PATTERNS = [
        r"^ls\b",                    # 列目录
        r"^cat\s+/tmp/",            # 读临时文件
        r"^git\s+(?:status|log|diff)\b",  # 只读 git
    ]

    def classify(self, tool, input) -> ClassResult:
        for pattern in self.DENY_PATTERNS:
            if re.search(pattern, input):
                return ClassResult(DENY, confidence=0.95)
        for pattern in self.ALLOW_PATTERNS:
            if re.search(pattern, input):
                return ClassResult(ALLOW, confidence=0.90)
        return ClassResult(UNCERTAIN)
```

## Phase B — 慢速分类器（AI 推理）

- 调用语言模型，传入完整对话历史
- 评估请求在上下文中是否合理
- 仅在 Phase A 返回 `uncertain` 时调用
- 典型延迟 100-500ms

```python
class SlowClassifier:
    async def classify(self, tool, input, history) -> ClassResult:
        prompt = f"""
        Given this conversation context:
        {format_history(history[-10:])}

        Is this tool call appropriate?
        Tool: {tool.name}
        Input: {input}

        Consider: Is this a logical next step? Does it match the user's intent?
        """
        response = await llm.classify(prompt)
        return parse_response(response)
```

### 关键能力差异

慢速分类器能访问对话历史——这是它的核心区分能力。一个孤立看起来危险的命令，放在上下文中可能完全合理。快速分类器无法评估上下文；慢速分类器可以。

**示例**：`rm -rf build/` 孤立看是危险操作，但如果前面的对话是"帮我清理构建产物"，则完全合理。

## 组合流程

```python
async def classify_tool_call(tool, input, history):
    # Phase A: 快速判断
    fast_result = fast_classifier.classify(tool, input)
    if fast_result.decision != UNCERTAIN:
        return fast_result

    # Phase B: 慢速判断（仅歧义场景）
    try:
        slow_result = await slow_classifier.classify(tool, input, history)
        if slow_result.confidence < THRESHOLD:
            return ClassResult(ASK)    # 信心不足 → 问用户
        return slow_result
    except Exception:
        return ClassResult(DENY)       # 异常 → fail-closed
```

## 设计原则

- **按成本排序，便宜优先**：大多数调用是明显安全或明显危险的，不值得花 AI 推理的钱。
- **阈值保守**：分类器信心不足时，宁可问用户。额外一次确认的代价远低于误操作。
- **审计一切**：每次分类决策记录工具名、输入、决策、来源（rule/fast/slow/user），用于复盘和规则迭代。
