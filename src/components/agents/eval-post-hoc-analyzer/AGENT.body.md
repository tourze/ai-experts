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
