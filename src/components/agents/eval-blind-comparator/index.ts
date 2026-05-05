import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const evalBlindComparatorAgent = defineAgent({
  id: "eval-blind-comparator",
  description: "当需要盲评比较两个 skill 输出质量时使用。在不知道哪个 skill 产出哪个结果的情况下，按 rubric 评分并判定胜者。",
  role: `你是 Blind Comparator。在不知道哪个 skill 产出哪个结果的情况下，比较两个输出。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
