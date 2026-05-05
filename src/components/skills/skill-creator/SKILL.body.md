## 创建流程

- 明确 skill 要做什么，以及大致应该怎样做
- 编写 skill 初稿
- 写几个测试 prompt，并让带目标 skill 的 Claude 跑一遍
- 帮用户同时做定性和定量评估
  - 运行在后台进行时，如果还没有定量 eval，就先草拟一组；如果已有 eval，检查它们是否还能直接使用或是否需要调整。然后向用户解释这些 eval 检查什么
  - 用 `eval-viewer/generate_review.py` 展示结果，让用户能查看输出并查看定量指标
- 根据用户反馈重写 skill；如果定量 benchmark 暴露明显问题，也一并修正
- 重复，直到结果足够好
- 扩大测试集，再做更大规模验证

使用这个 skill 时，先判断用户处在流程的哪一步，然后从那里接上。用户可能只是说“我想做一个 X 的 skill”；这时需要帮他收敛意图、写草稿、写测试用例、设计评估方式、运行测试并迭代。用户也可能已经有了 skill 初稿；这时可以直接进入 eval 和迭代环节。

流程可以灵活处理。用户明确说“不需要跑一堆评估，只想一起想想”时，可以只做协作式设计和改写。

skill 完成后，可以使用 description 优化脚本，专门优化 frontmatter `description` 的触发准确率。

## 与用户沟通

skill-creator 的用户可能技术背景差异很大。默认沟通方式应该清楚、直接，避免不必要的术语。

- “evaluation”和“benchmark”这类词可以使用，但最好在第一次出现时顺手解释
- “JSON”“assertion”这类术语只有在用户明显熟悉时才直接使用；否则用一句短定义说明

不确定用户是否理解术语时，优先短解释，不要大段教学。

---

## 创建 skill

### 捕获意图

先理解用户意图。当前对话里可能已经包含用户想沉淀成 skill 的工作流，例如用户说“把这个变成 skill”。这种情况下，先从对话历史提取答案：用过哪些工具、步骤顺序、用户纠正过什么、观察到的输入/输出格式。缺口可以让用户补充，进入下一步前要让用户确认关键点。

1. 这个 skill 应该让 Claude 能做什么？
2. 什么时候应该触发这个 skill？也就是用户会怎么说、在什么上下文里需要它？
3. 期望输出格式是什么？
4. 是否要设置测试用例来验证 skill 有效？决策规则：如果输出可以通过 diff、解析器或脚本验证，例如文件转换、数据抽取、代码生成、固定流程步骤，默认 **要**；如果输出本质上偏主观，例如写作风格、创意方向、战略建议，默认 **不要**。说明默认选择的理由，但允许用户覆盖。

### 基于来源改进

改进已有 skill 时，编辑前先做一次短来源检查：识别来源材料，例如官方文档、代码、telemetry、失败 transcript、用户反馈；写一个验收目标，例如“agent 应稳定做到 X，并避免 Y”；区分来源事实与推断；如果任务可测试，保留旧 skill 作为 eval baseline。不要因为来源材料里有很多背景就全部塞进 skill，只保留会改变 agent 行为的知识。

### 访谈与调研

主动询问边界情况、输入/输出格式、示例文件、成功标准和依赖项。没有弄清这些信息前，不要急着写测试 prompt。

检查可用 MCP。如果 MCP 对调研有帮助，例如搜索文档、找类似 skill、查最佳实践，可以使用。能用子代理时可并行调研；不能用时内联完成。目标是先带着上下文回来，降低用户回答负担。

### 编写 `SKILL.md`

根据访谈结果填充这些部分：

- **name**：skill 标识符
- **description**：什么时候触发、它做什么。这是主要触发机制，必须同时说明 skill 做什么，以及哪些场景该用它。所有 “when to use” 信息都放在这里，不放在正文里。目前 Claude 倾向于 undertrigger，也就是该用 skill 时没有用。为了对抗这个问题，description 要稍微主动一些。例如不要写 “How to build a simple fast dashboard to display internal Anthropic data.”，可以写成 “How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'”
- **compatibility**：所需工具和依赖，可选，通常不需要
- **其余正文**：具体工作流、规则、示例和资源指引

### Skill 写作指南

#### Skill 结构

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - 用于确定性或重复任务的可执行代码
    ├── references/ - 按需加载到上下文的文档
    └── assets/     - 输出产物会用到的文件，例如模板、图标、字体
```

#### 渐进披露

Skill 使用三级加载系统：

1. **Metadata**（name + description）- 始终在上下文中，大约 100 词
2. **SKILL.md body** - skill 触发后进入上下文，理想上少于 500 行
3. **Bundled resources** - 需要时再读取；脚本可直接执行，不必全部塞进上下文

这些行数只是经验值，确有需要时可以更长。

关键模式：

- 保持 `SKILL.md` 少于 500 行；接近限制时，把细节拆到引用文件，并在主文件里清楚说明何时读取
- 从 `SKILL.md` 明确链接引用文件，并说明读取条件
- 大引用文件超过 300 行时，在文件开头放目录

领域组织方式：当 skill 支持多个领域或框架时，按变体组织：

```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

Claude 只读取相关引用文件。

#### 不惊讶原则

Skill 不能包含恶意软件、利用代码，或任何可能破坏系统安全的内容。Skill 内容与 description 所表达的意图必须一致，不能让用户意外。不要协助创建误导性 skill，或用于未授权访问、数据外泄等恶意行为的 skill。角色扮演类 skill 可以接受，只要不违反安全边界。

#### 写作模式

指令优先使用祈使句。

定义输出格式时，可以这样写：

```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

示例模式：

```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### 写作风格

尽量解释为什么，而不是堆叠生硬的 MUST。把模型当作能理解意图的协作者：让 skill 通用，而不是只贴住少数示例。先写初稿，再像第一次读一样回看并收紧。

### 测试用例

写完 skill 初稿后，设计 2-3 个真实测试 prompt，也就是用户真的可能会说的话。把它们给用户看，例如：“我想先试这几个测试用例。它们合适吗，还是你想补充？”然后再运行。

对压力敏感的 skill，至少包含一个试图让 agent 跳过规则的 prompt：时间压力、权威压力、“先简单做”、“我们已经同意过”。在 eval metadata 中记录期望的拒绝行为或纪律性行为。

将测试用例保存到 `evals/evals.json`。先不要写 assertions，只写 prompts。下一步在运行过程中再起草 assertions。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

完整 schema 见 `references/schemas.md`，其中包括稍后要添加的 `assertions` 字段。

## 运行并评估测试用例

这一段是连续流程，不要中途停下。不要使用 `/skill-test` 或其他测试 skill。

把结果放在与 skill 目录同级的 `<skill-name>-workspace/`。workspace 内按迭代组织结果，例如 `iteration-1/`、`iteration-2/`；每个测试用例再有自己的目录，例如 `eval-0/`、`eval-1/`。不要一开始就创建所有目录，按运行进度创建即可。

### Step 1：同一轮启动所有运行（with-skill 和 baseline）

每个测试用例都要在同一轮中启动两个运行：一个带 skill，一个不带或带旧版 baseline。这一点很重要：不要先跑 with-skill，再回来补 baseline。一次性启动，才能让结果在相近时间完成。

**With-skill run：**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline run** 使用方式取决于上下文：

- **创建新 skill**：完全不使用 skill。同一个 prompt，保存到 `without_skill/outputs/`
- **改进已有 skill**：使用旧版。编辑前先快照 skill：`cp -r <skill-path> <workspace>/skill-snapshot/`，然后让 baseline 子代理指向快照，保存到 `old_skill/outputs/`

为每个测试用例写 `eval_metadata.json`，`assertions` 暂时可以为空。`eval_name` 要描述它测试什么，不要只叫 `eval-0`。目录名也使用这个描述性名称。如果本轮使用新增或修改过的 eval prompt，要为每个新 eval 目录创建这些文件，不要假设能沿用上一轮。

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2：运行期间起草 assertions

不要只是等待运行完成。利用这段时间为每个测试用例起草定量 assertions，并向用户说明它们检查什么。如果 `evals/evals.json` 里已经有 assertions，检查并解释现有 assertions。

好的 assertions 应该能客观验证，并且名称清楚；在 benchmark viewer 里一眼能看懂它检查什么。主观型 skill 更适合定性评估，不要强行把需要人工判断的质量压成 assertion。

起草完后，更新 `eval_metadata.json` 和 `evals/evals.json`。同时告诉用户 viewer 会看到什么：定性输出和定量 benchmark。

### Step 3：运行完成时记录 timing

每个子代理任务完成时，通知里会包含 `total_tokens` 和 `duration_ms`。立即把这些数据写入对应 run 目录的 `timing.json`：

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

这是唯一能捕获这些数据的机会；它们不会保存在别处。收到每个通知就处理，不要等全部结束后再批量补。

### Step 4：评分、聚合并启动 viewer

所有运行完成后：

1. **给每个 run 评分**：启动 grader 子代理，或内联评分。读取 `agents/grader.md`，根据 outputs 评估每个 assertion。结果保存到每个 run 目录的 `grading.json`。`grading.json` 中 `expectations` 数组必须使用字段 `text`、`passed`、`evidence`，不要用 `name`、`met`、`details` 或其他变体；viewer 依赖这些精确字段名。能用脚本检查的 assertion，就写脚本运行，不要只靠肉眼看；脚本更快、更可靠，也能在后续迭代复用。

2. **聚合 benchmark**：从 skill-creator 目录运行聚合脚本：
   ```bash
   node scripts/aggregate_benchmark.mjs <workspace>/iteration-N --skill-name <name>
   ```
   这会生成 `benchmark.json` 和 `benchmark.md`，包含每种配置的 pass_rate、time、tokens，以及 mean ± stddev 和 delta。手写 `benchmark.json` 时，必须参考 `references/schemas.md` 的准确 schema。

   排序时，把每个 with_skill 版本放在对应 baseline 前面。

3. **做 analyst pass**：读取 benchmark 数据，指出汇总统计可能掩盖的模式。查看 `agents/analyzer.md` 的 “Analyzing Benchmark Results” 部分，重点找永远通过的 assertion（无法区分 skill 价值）、高方差 eval（可能 flaky）、时间/token 取舍等。

4. **启动 viewer**，同时展示定性输出和定量数据：
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   第 2 轮及以后，同时传 `--previous-workspace <workspace>/iteration-<N-1>`。

   **Cowork / headless 环境**：如果 `webbrowser.open()` 不可用，或环境没有显示器，使用 `--static <output_path>` 写出独立 HTML 文件，而不是启动 server。用户点击“提交全部 Review”后会下载 `feedback.json`。下载后，把 `feedback.json` 复制到 workspace 目录，供下一轮迭代读取。

   注意：请使用 `eval-viewer/generate_review.py` 创建 viewer，不需要自写 HTML。

5. **告诉用户**，例如：“我已经在浏览器里打开结果页。里面有两个 tab：`输出` 用来逐个查看测试输出并留下反馈，`Benchmark` 展示定量对比。看完后回来告诉我你已完成 review。”

### 用户在 viewer 中看到什么

`输出` tab 每次显示一个测试用例：

- **Prompt**：执行时给出的任务
- **Output**：skill 产出的文件，能内联渲染就内联渲染
- **Previous Output**（第 2 轮及以后）：折叠显示上一轮输出
- **Formal Grades**（如果运行了评分）：折叠显示 assertion 通过/失败情况
- **Feedback**：自动保存的文本框
- **Previous Feedback**（第 2 轮及以后）：上一轮评论，显示在文本框下方

`Benchmark` tab 展示统计摘要：每种配置的 pass rate、耗时、token 用量、逐 eval 拆分和 analyst observations。

可用上一个/下一个按钮或方向键导航。完成后，用户点击“提交全部 Review”，所有反馈保存到 `feedback.json`。

### Step 5：读取反馈

用户说 review 完成后，读取 `feedback.json`：

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

空 feedback 表示用户认为没问题。优先改进用户提出具体问题的测试用例。

完成后关闭 viewer server：

```bash
kill $VIEWER_PID 2>/dev/null
```

---

## 改进 skill

这是循环的核心。你已经运行测试用例，用户也 review 了结果；接下来要根据反馈让 skill 更好。

### 怎样思考改进

1. **从反馈中泛化。** 这里的目标是创建可以反复使用的 skill，而不是只在少数例子上表现好。用户和你反复迭代几个例子，是为了快速判断输出质量；但如果 skill 只能覆盖这些例子，就没有价值。遇到顽固问题时，不要写过拟合的小修补，也不要堆压迫性的 MUST。应当问：这个例子教会了我们什么原则？把原则写进 skill。

2. **保持 prompt 精炼。** 删除没有产生行为收益的内容。阅读 transcripts，而不仅是最终输出；如果 skill 让模型花很多时间做无效动作，考虑删掉诱发这些动作的指令。

3. **解释为什么。** 尽量说明每条要求背后的动机。LLM 能理解意图；好的约束能让它在新场景里更好地适配。如果你发现自己在写一堆 ALWAYS 或 NEVER，这是警讯。能解释原因时，优先解释原因，让模型知道为什么这件事重要。

4. **寻找测试用例之间的重复劳动。** 阅读测试运行 transcript。如果多个子代理都独立写了相似 helper script，或采用同一套多步骤处理方式，例如每个测试都写 `create_docx.py` 或 `build_chart.py`，这是强信号：skill 应该把脚本放进 `scripts/`，未来每次调用都直接复用。

这项任务重要，思考时间不是瓶颈。先写修订草稿，再重新审一遍，尽量理解用户真正要的结果，并把这种理解写进指令。

### 迭代循环

改进 skill 后：

1. 应用改动
2. 把所有测试用例重新跑到新的 `iteration-<N+1>/` 目录，并包含 baseline 运行。创建新 skill 时，baseline 始终是 `without_skill`；改进已有 skill 时，根据目标判断 baseline 应该是用户带来的原始版本还是上一轮版本
3. 启动 reviewer，并用 `--previous-workspace` 指向上一轮
4. 等用户 review 并告诉你完成
5. 读取新反馈，再次改进，重复

持续迭代直到：

- 用户说满意
- feedback 全为空，说明看起来都可以
- 已经没有实质进展

---

## Advanced：盲评比较

当需要更严格地比较两个 skill 版本，例如用户问“新版本真的更好吗？”，可以使用 blind comparison 系统。读取 `agents/comparator.md` 和 `agents/analyzer.md`。基本思路是：把两个输出交给独立 agent，不告诉它们分别来自哪个 skill，让它只按质量判断；然后分析胜者为什么赢。

这是可选流程，需要子代理；大多数用户不需要。通常人工 review 循环已经足够。

---

## Description Optimization

`SKILL.md` frontmatter 中的 `description` 是 Claude 决定是否调用 skill 的主要机制。创建或改进 skill 后，可以主动提出优化 description，以提高触发准确率。

### Step 1：生成触发 eval queries

创建 20 个 eval queries，混合 should-trigger 和 should-not-trigger。保存为 JSON：

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

这些 query 必须真实，像 Claude Code 或 Claude.ai 用户真的会输入的内容。不要写抽象请求，而要写具体、带上下文的请求：文件路径、个人工作背景、列名和值、公司名、URL、少量前情。可以包含小写、缩写、错别字或口语表达。长度要有变化，重点覆盖边界场景，而不是只写一眼就清楚的例子；用户之后会 review 这组 eval。

坏例子：`"Format this data"`、`"Extract text from PDF"`、`"Create a chart"`

好例子：`"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

对 **should-trigger** queries（8-10 个），关注覆盖面：同一意图的不同说法，包括正式和随意表达；用户没有显式说出 skill 名或文件类型，但明显需要它的情况；少见用法；与相邻 skill 竞争但这里应该胜出的场景。

对 **should-not-trigger** queries（8-10 个），最有价值的是 near-misses：共享关键词或概念，但实际需要另一个 skill；模糊表述会让朴素关键词匹配误触发；query 提到本 skill 的某些内容，但主意图指向别处。例如提到 “database”，但真正任务是基础设施监控，而不是 schema 设计。

不要把 should-not-trigger 写得明显无关。用 `"Write a fibonacci function"` 作为 PDF skill 的负例太容易，测不出能力。负例应该真的有迷惑性。

### Step 2：让用户 review

用 HTML 模板把 eval set 展示给用户：

1. 读取 `assets/eval_review.html`
2. 替换占位符：
   - `__EVAL_DATA_PLACEHOLDER__` → eval items 的 JSON 数组，不加引号，因为它是 JS 变量赋值
   - `__SKILL_NAME_PLACEHOLDER__` → skill 名称
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → 当前 skill description
3. 写到临时文件，例如 `/tmp/eval_review_<skill-name>.html`，并打开：`open /tmp/eval_review_<skill-name>.html`
4. 用户可以编辑 query、切换 should-trigger、增删条目，然后点击 “Export Eval Set”
5. 文件会下载到 `~/Downloads/eval_set.json`；如果有多个版本，例如 `eval_set (1).json`，检查 Downloads 里最新的一个

这一步很重要：eval query 质量差，会直接导致 description 优化结果差。

### Step 3：运行优化循环

告诉用户：“这个过程需要一些时间；我会在后台运行 optimization loop，并定期检查进度。”

将 eval set 保存到 workspace，然后后台运行：

```bash
node scripts/run_loop.mjs \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

使用当前会话实际使用的 model ID，这样触发测试与用户真实体验一致。

运行期间，定期查看输出，告诉用户当前迭代轮次和分数。

这个脚本会自动处理完整优化循环：把 eval set 拆成 60% train 和 40% held-out test；评估当前 description（每个 query 运行 3 次以获得稳定触发率）；调用 Claude 根据失败样本提出改进；在 train 和 test 上重新评估新 description；最多迭代 5 次。完成后会在浏览器中打开 HTML report，并返回带 `best_description` 的 JSON。`best_description` 按 test score 选择，而不是 train score，避免过拟合。

### 触发机制说明

理解触发机制有助于设计更好的 eval query。Skills 会以 name + description 出现在 Claude 的 `available_skills` 列表中，Claude 根据 description 判断是否咨询某个 skill。关键点是：Claude 只会在任务明显需要额外能力时才咨询 skill。像“read this PDF”这种简单一步请求，即使 description 匹配，也可能不触发，因为 Claude 用基础工具就能完成。复杂、多步骤、专门化的请求，只要 description 匹配，就更稳定触发。

因此 eval query 应该足够实质化，让 Claude 真的会受益于 skill。`"read file X"` 这类简单 query 不适合作为触发测试，因为无论 description 写得多好，它们都可能不触发。

### Step 4：应用结果

从 JSON 输出中取 `best_description`，更新 skill 的 `SKILL.md` frontmatter。向用户展示 before/after，并报告分数。

---

### 打包并展示（仅当 `present_files` tool 可用）

检查是否能使用 `present_files` tool。不能用就跳过。能用时，打包 skill 并把 `.skill` 文件展示给用户：

```bash
node scripts/package_skill.mjs <path/to/skill-folder>
```

打包完成后，告诉用户生成的 `.skill` 文件路径，便于安装。

---

## Claude.ai / Cowork 适配

**Claude.ai**：没有子代理，因此测试用例由你自己顺序执行。跳过 baselines、blind comparison 和 description optimization（`claude -p`）。结果内联展示。打包在任何环境都可用。

**Cowork**：子代理可用。eval viewer 使用 `--static <output_path>`（无浏览器）。自评前一定先生成 eval viewer。用户反馈会下载为 `feedback.json`。

**更新已有 skills**（两种环境都适用）：保留原 name。编辑前复制到 `/tmp/skill-name/`，因为安装路径可能只读。手动打包时先在 `/tmp/` 暂存。

---

## 引用文件

`agents/` 目录包含专用子代理说明。需要启动对应子代理时再读取。

- `agents/grader.md` — 如何根据 outputs 评估 assertions
- `agents/comparator.md` — 如何对两个输出做 blind A/B comparison
- `agents/analyzer.md` — 如何分析一个版本为什么胜出

`references/` 目录包含补充文档：

- `references/schemas.md` — `evals.json`、`grading.json` 等 JSON 结构

---

再次强调核心循环：

- 弄清 skill 的目标
- 起草或编辑 skill
- 用测试 prompt 运行带 skill 的 Claude
- 和用户一起评估输出：
  - 创建 `benchmark.json` 并运行 `eval-viewer/generate_review.py`，帮助用户 review
  - 运行定量 eval
- 重复，直到你和用户都满意
- 打包最终 skill 并交付

使用 TodoList 跟踪进度。在 Cowork 中，尤其要把 “Create evals JSON and run `eval-viewer/generate_review.py`” 放进列表。
