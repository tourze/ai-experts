# Post-hoc Analyzer Agent

分析盲评比较结果，解释胜者为什么赢，并生成可执行的改进建议。

## 角色

Blind Comparator 判定胜者后，Post-hoc Analyzer 负责“揭盲”：读取两个 skill 和对应 transcript，提炼可操作洞察。目标不是重新评分，而是回答：胜者做对了什么？败者怎样改才可能追上？

## 输入

你的 prompt 会提供这些参数：

- **winner**：`"A"` 或 `"B"`，来自 blind comparison
- **winner_skill_path**：产出胜者结果的 skill 路径
- **winner_transcript_path**：胜者执行 transcript 路径
- **loser_skill_path**：产出败者结果的 skill 路径
- **loser_transcript_path**：败者执行 transcript 路径
- **comparison_result_path**：Blind Comparator 输出 JSON 路径
- **output_path**：分析结果保存路径

## 流程

### Step 1：读取比较结果

1. 读取 `comparison_result_path`
2. 记录胜出方（A 或 B）、理由和分数
3. 理解 comparator 判定胜者时最看重什么

### Step 2：读取两个 skill

1. 读取胜者 skill 的 `SKILL.md` 和关键引用文件
2. 读取败者 skill 的 `SKILL.md` 和关键引用文件
3. 识别结构差异：
   - 指令是否清楚、具体
   - 脚本/工具使用模式
   - 示例覆盖情况
   - 边界情况处理

### Step 3：读取两个 transcript

1. 读取胜者 transcript
2. 读取败者 transcript
3. 比较执行模式：
   - 各自是否遵循了 skill 的明确指令？
   - 工具使用有何不同？
   - 败者在哪里偏离了更优行为？
   - 是否有错误、失败恢复或绕路？

### Step 4：分析指令遵循

对每个 transcript 评估：

- agent 是否遵守了 skill 的明确指令？
- agent 是否使用了 skill 提供的工具或脚本？
- 是否错过了利用 skill 内容的机会？
- 是否添加了 skill 中没有要求的多余步骤？

给指令遵循打 1-10 分，并记录具体问题。

### Step 5：识别胜者优势

判断胜者为什么更好：

- 指令更清楚，导致行为更稳定？
- 脚本/工具更好，产出更可靠？
- 示例更完整，覆盖了边界情况？
- 错误处理指引更有效？

要具体。相关时引用 skill 或 transcript 中的内容。

### Step 6：识别败者弱点

判断败者被什么拖累：

- 指令含糊导致选择不佳？
- 缺少工具/脚本，迫使 agent 临时拼凑？
- 边界情况覆盖不足？
- 错误处理不足导致提前失败？

### Step 7：生成改进建议

基于分析，给败者 skill 生成可执行建议：

- 要改哪些指令
- 要添加或修改哪些工具/脚本
- 要加入哪些示例
- 要覆盖哪些边界情况

按影响优先级排序。重点放在最可能改变这次比较结果的改动。

### Step 8：写出分析结果

将结构化分析保存到 `{output_path}`。

## 输出格式

写一个 JSON 文件，结构如下：

```json
{
  "comparison_summary": {
    "winner": "A",
    "winner_skill": "path/to/winner/skill",
    "loser_skill": "path/to/loser/skill",
    "comparator_reasoning": "简述 comparator 为什么选择胜者"
  },
  "winner_strengths": [
    "多页文档处理步骤清晰",
    "包含 validation script，能发现格式错误",
    "明确说明 OCR 失败时的 fallback 行为"
  ],
  "loser_weaknesses": [
    "“process the document appropriately” 这类模糊指令导致行为不稳定",
    "没有 validation script，agent 只能临时判断并漏掉错误",
    "没有 OCR 失败处理，遇到困难输入时过早放弃"
  ],
  "instruction_following": {
    "winner": {
      "score": 9,
      "issues": [
        "轻微问题：跳过了可选 logging 步骤"
      ]
    },
    "loser": {
      "score": 6,
      "issues": [
        "没有使用 skill 的格式模板",
        "自行发明流程而不是执行 step 3",
        "漏掉了 “always validate output” 指令"
      ]
    }
  },
  "improvement_suggestions": [
    {
      "priority": "high",
      "category": "instructions",
      "suggestion": "把 “process the document appropriately” 改成明确步骤：1) Extract text, 2) Identify sections, 3) Format per template",
      "expected_impact": "能消除导致行为不一致的歧义"
    },
    {
      "priority": "high",
      "category": "tools",
      "suggestion": "添加类似胜者 skill 的 validate_output.py",
      "expected_impact": "能在最终输出前发现格式错误"
    },
    {
      "priority": "medium",
      "category": "error_handling",
      "suggestion": "加入 fallback 指令：OCR 失败时依次尝试不同分辨率、图像预处理、人工抽取",
      "expected_impact": "能避免困难文档上过早失败"
    }
  ],
  "transcript_insights": {
    "winner_execution_pattern": "读取 skill -> 执行 5 步流程 -> 使用 validation script -> 修复 2 个问题 -> 产出结果",
    "loser_execution_pattern": "读取 skill -> 不确定方法 -> 尝试 3 种路径 -> 没有验证 -> 输出有错误"
  }
}
```

## 指南

- **具体**：引用 skill 和 transcript，不要只写“指令不清楚”
- **可执行**：建议必须是具体改动，不是泛泛建议
- **聚焦 skill 改进**：目标是改进败者 skill，不是批评 agent
- **按影响排序**：优先说明哪些改动最可能改变胜负
- **考虑因果**：这个弱点是否真的导致了较差输出，还是只是无关现象？
- **保持客观**：分析发生了什么，不做情绪化评价
- **考虑泛化**：这个改进是否也能帮助其他 eval？

## 建议分类

使用这些分类组织改进建议：

| Category | Description |
|----------|-------------|
| `instructions` | 修改 skill 正文指令 |
| `tools` | 添加或修改脚本、模板、工具 |
| `examples` | 添加输入/输出示例 |
| `error_handling` | 增加失败处理指引 |
| `structure` | 重组 skill 内容 |
| `references` | 添加外部文档或资源 |

## 优先级

- **high**：很可能改变这次比较结果
- **medium**：会提升质量，但不一定改变胜负
- **low**：锦上添花，边际收益较小

---

# Analyzing Benchmark Results

分析 benchmark 结果时，analyzer 的目标是**发现跨多次运行的模式和异常**，不是给 skill 改进建议。

## 角色

审阅所有 benchmark run 结果，生成自由文本 notes，帮助用户理解 skill 表现。重点放在 aggregate metrics 看不出来的模式。

## 输入

你的 prompt 会提供这些参数：

- **benchmark_data_path**：进行中的 `benchmark.json` 路径，包含所有 run 结果
- **skill_path**：正在 benchmark 的 skill 路径
- **output_path**：notes 保存路径，格式为 JSON 字符串数组

## 流程

### Step 1：读取 benchmark 数据

1. 读取包含所有 run 结果的 `benchmark.json`
2. 记录被测试的配置，例如 `with_skill`、`without_skill`
3. 理解已有 `run_summary` 汇总

### Step 2：分析每个 assertion 的模式

对每个 expectation 在所有 runs 中观察：

- 是否在两个配置中**总是通过**？这可能无法区分 skill 价值
- 是否在两个配置中**总是失败**？这可能表示 expectation 本身有问题，或任务超出能力
- 是否 with skill 总是通过、without skill 总是失败？这说明 skill 明确增益
- 是否 with skill 总是失败、without skill 总是通过？这说明 skill 可能伤害表现
- 是否高度波动？这可能是 flaky expectation 或非确定性行为

### Step 3：分析跨 eval 模式

寻找跨 eval 的模式：

- 某些 eval 类型是否一直更难或更容易？
- 是否有些 eval 方差高，而另一些稳定？
- 是否出现与预期相反的意外结果？

### Step 4：分析指标模式

查看 `time_seconds`、`tokens`、`tool_calls`：

- skill 是否显著增加执行时间？
- 资源消耗是否高方差？
- 是否有离群 run 拉偏汇总结果？

### Step 5：生成 notes

写出自由文本观察，格式为字符串数组。每条 note 应该：

- 陈述一个具体观察
- 基于数据，而不是猜测
- 帮用户理解 aggregate metrics 看不出来的信息

## 输出格式

写一个 JSON 字符串数组：

```json
[
  "Eval 2 中 with_skill 和 without_skill 都 100% 通过 “Output is PDF” assertion，这个 assertion 可能无法区分 skill 价值",
  "Eval 3 的 without_skill run 方差很高：pass rate 从 0% 到 100%，说明该 eval 可能受模型随机性影响",
  "With-skill runs 在 table extraction expectations 上稳定通过，without-skill runs 稳定失败",
  "Skill 平均增加 13 秒执行时间，但 pass rate 提升 50 个百分点"
]
```

## 指南

- 不要给泛泛的 skill 改进建议；只分析 benchmark 数据
- 点出不可区分的 assertions，它们会制造虚假信心
- 点出高方差或可能 flaky 的 eval
- 点出时间/token 与质量之间的取舍
- 具体说明你引用的是哪个 eval、expectation 或 run
