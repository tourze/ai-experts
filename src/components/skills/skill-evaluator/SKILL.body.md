## 路由

| 意图 | 模式 |
|------|------|
| 给 skill 打分/审查设计质量/结构合理性/知识增量 | Mode A |
| 验证 skill 是否遗漏源材料关键事实/能否独立支撑任务 | Mode B |
| 创建新 skill | `skill-creator` |
| 用参考 skill 优化目标 skill | `skill-evolver` |
| 只优化 description 触发质量 | `skill-activation-analyzer` |

## Mode A — 设计评分

**核心公式**：Good Skill = Expert-only Knowledge − What Claude Already Knows

三类知识：Expert（必须保留）/ Activation（精简保留）/ Redundant（删除）。

### 8 维度（120 分）

**MANDATORY — 读取完整评分标准**：`references/evaluation-dimensions.md`

| D# | 维度 | 分 | 核心问题 |
|----|------|----|---------|
| D1 | Knowledge Delta | 20 | 是否提供模型不具备的知识？ |
| D2 | Mindset + Procedures | 15 | 是否传递思考模式和领域流程？ |
| D3 | Anti-Pattern Quality | 15 | 是否有专家级 NEVER 清单及 WHY？ |
| D4 | Specification Compliance | 15 | description 是否 WHAT + WHEN + KEYWORDS？ |
| D5 | Progressive Disclosure | 15 | 内容分层（SKILL.md < 500 行，refs 按需）？ |
| D6 | Freedom Calibration | 15 | 约束程度是否匹配任务脆弱性？ |
| D7 | Pattern Recognition | 10 | 是否遵循已知 skill 模式？ |
| D8 | Practical Usability | 15 | Agent 能否直接据此行动？ |

### 评分流程

**MANDATORY — 读取完整协议**：`references/evaluation-protocol.md`

1. Knowledge Delta Scan — 每节标 [E]/[A]/[R]
2. Structure Analysis — frontmatter、行数、引用、模式
3. 逐维度评分 — 证据驱动，一行理由
4. 总分与等级 — A (90%+) / B (80-89%) / C (70-79%) / D (60-69%) / F (<60%)
5. 生成报告 — 按 `references/evaluation-protocol.md` 模板

### NEVER（评分纪律）

- NEVER 因格式漂亮给高分；NEVER 忽略 token 浪费
- NEVER 被篇幅打动 — 43 行可优于 500 行
- NEVER 跳过心理模拟决策树；NEVER 容忍基础概念解释
- NEVER 忽略缺失的反模式 — 无 NEVER 清单是重大缺口
- NEVER 把触发条件只放正文 — Agent 加载前只看 description

## Mode B — 知识覆盖验证

闭卷考试验证 skill 知识完备性。`<skill-path>` 是被测 skill，`<source-path>` 是知识来源。

### 四步流程

**Step 1 — Examiner 出题**：派遣子代理（haiku 模型）只读 `<source-path>`，生成 5-8 题，每题含 answer_key + 2-5 required_facts。覆盖细节/逻辑/集成三类。**MANDATORY**：读取 `references/examiner-prompt.md`。

**Step 2 — Examinee 闭卷答题**：子代理只读 `<skill-path>` 作答，答不出回 "CANNOT_ANSWER"。**MANDATORY**：读取 `references/examinee-prompt.md`。

**Step 3 — 评判**：逐题对比答案与 required_facts。全覆盖 = PASS，任一缺失 = FAIL。

**Step 4 — 循环**：100% 通过 → 输出报告；失败 → 展示缺口建议补充，最多 3 轮。

### 输出

```markdown
# Skill 验证报告 — {skill-name}
- 通过率：X/Y (Z%) | 轮次：N/3

## 失败的题目
| 题目 | 期望事实 | 实际答案 | 缺口 |
|------|---------|---------|------|

## 建议补充方向
```

## 元问题

> "这个领域的专家看了这个 skill，会说'这捕捉到了我花多年才学到的知识'吗？"

是 → 真正的价值。否 → 在压缩 Claude 已知的内容。
