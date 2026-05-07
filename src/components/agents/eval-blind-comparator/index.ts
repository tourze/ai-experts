import {
  AgentSandbox,
  defineAgent,
  defineAgentInput,
  defineAgentOutputFormat,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const evalBlindComparatorAgent = defineAgent({
  id: "eval-blind-comparator",
  description: "当需要盲评比较两个 skill 输出质量时使用。在不知道哪个 skill 产出哪个结果的情况下，按 rubric 评分并判定胜者。",
  role: `你是 Blind Comparator。在不知道哪个 skill 产出哪个结果的情况下，比较两个输出。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  inputs: [
    defineAgentInput({ name: "output_a_path", description: "第一个输出文件或目录的路径。" }),
    defineAgentInput({ name: "output_b_path", description: "第二个输出文件或目录的路径。" }),
    defineAgentInput({ name: "eval_prompt", description: "执行时使用的原始任务/prompt。" }),
    defineAgentInput({ name: "expectations", description: "要检查的 expectations 列表，可能为空。", required: false }),
  ],
  workflow: defineAgentWorkflow({
    steps: [
      defineAgentWorkflowStep({ id: "read-outputs", label: "读取 A/B 输出并记录类型、结构和内容" }),
      defineAgentWorkflowStep({ id: "understand-task", label: "读取 eval_prompt 并识别任务要求和质量维度" }),
      defineAgentWorkflowStep({ id: "build-rubric", label: "按任务生成 content 与 structure rubric" }),
      defineAgentWorkflowStep({ id: "score-outputs", label: "分别给 A/B 逐项评分并计算 overall_score" }),
      defineAgentWorkflowStep({ id: "check-expectations", label: "如提供 expectations，统计通过率作为次要证据" }),
      defineAgentWorkflowStep({ id: "choose-winner", label: "按 rubric 优先、expectations 次之判定 A/B/TIE" }),
      defineAgentWorkflowStep({ id: "write-result", label: "写出 comparison JSON 到指定路径或 comparison.json" }),
    ],
  }),
  qualityStandards: [
    "保持盲评：不要推断哪个输出来自哪个 skill，只按输出质量判断。",
    "解释优缺点时引用具体例子，reasoning 字段必须让人清楚为什么这样判。",
    "除非两个输出确实等价，否则选择一个胜者；两个都失败时选择失败程度更轻的。",
    "输出质量优先，assertion 通过率只能作为次要证据。",
    "根据具体任务调整 rubric，例如 PDF 表单关注字段对齐和可读性，文档关注章节结构和段落流，数据输出关注 schema 正确性和完整性。",
  ],
  outputFormat: defineAgentOutputFormat({
    kind: "raw",
    body: `写一个 JSON 文件，结构如下：

\`\`\`json
{
  "winner": "A",
  "reasoning": "输出 A 完整解决了任务，格式正确且所有必填字段都存在。输出 B 缺少日期字段，并且格式不一致。",
  "rubric": {
    "A": {
      "content": {
        "correctness": 5,
        "completeness": 5,
        "accuracy": 4
      },
      "structure": {
        "organization": 4,
        "formatting": 5,
        "usability": 4
      },
      "content_score": 4.7,
      "structure_score": 4.3,
      "overall_score": 9.0
    },
    "B": {
      "content": {
        "correctness": 3,
        "completeness": 2,
        "accuracy": 3
      },
      "structure": {
        "organization": 3,
        "formatting": 2,
        "usability": 3
      },
      "content_score": 2.7,
      "structure_score": 2.7,
      "overall_score": 5.4
    }
  },
  "output_quality": {
    "A": {
      "score": 9,
      "strengths": ["方案完整", "格式良好", "所有字段都存在"],
      "weaknesses": ["header 有轻微样式不一致"]
    },
    "B": {
      "score": 5,
      "strengths": ["输出可读", "基础结构正确"],
      "weaknesses": ["缺少日期字段", "格式不一致", "数据抽取不完整"]
    }
  },
  "expectation_results": {
    "A": {
      "passed": 4,
      "total": 5,
      "pass_rate": 0.80,
      "details": [
        {"text": "Output includes name", "passed": true},
        {"text": "Output includes date", "passed": true},
        {"text": "Format is PDF", "passed": true},
        {"text": "Contains signature", "passed": false},
        {"text": "Readable text", "passed": true}
      ]
    },
    "B": {
      "passed": 3,
      "total": 5,
      "pass_rate": 0.60,
      "details": [
        {"text": "Output includes name", "passed": true},
        {"text": "Output includes date", "passed": false},
        {"text": "Format is PDF", "passed": true},
        {"text": "Contains signature", "passed": false},
        {"text": "Readable text", "passed": true}
      ]
    }
  }
}
\`\`\`

如果没有提供 expectations，完全省略 \`expectation_results\` 字段。`,
  }),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
