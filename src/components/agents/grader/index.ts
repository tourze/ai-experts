import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const graderAgent = defineAgent({
  id: "grader",
  description: "Agent grader.",
  role: `你是 Grader。根据执行 transcript 和 outputs 评估 expectations。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "raw",
    body: `写一个 JSON 文件，结构如下：

\`\`\`json
{
  "expectations": [
    {
      "text": "The output includes the name 'John Smith'",
      "passed": true,
      "evidence": "在 transcript Step 3 中发现：'Extracted names: John Smith, Sarah Johnson'"
    },
    {
      "text": "The spreadsheet has a SUM formula in cell B10",
      "passed": false,
      "evidence": "没有创建 spreadsheet；输出是一个 text file。"
    },
    {
      "text": "The assistant used the skill's OCR script",
      "passed": true,
      "evidence": "Transcript Step 2 显示：'Tool: Bash - python ocr_script.py image.png'"
    }
  ],
  "summary": {
    "passed": 2,
    "failed": 1,
    "total": 3,
    "pass_rate": 0.67
  },
  "execution_metrics": {
    "tool_calls": {
      "Read": 5,
      "Write": 2,
      "Bash": 8
    },
    "total_tool_calls": 15,
    "total_steps": 6,
    "errors_encountered": 0,
    "output_chars": 12450,
    "transcript_chars": 3200
  },
  "timing": {
    "executor_duration_seconds": 165.0,
    "grader_duration_seconds": 26.0,
    "total_duration_seconds": 191.0
  },
  "claims": [
    {
      "claim": "The form has 12 fillable fields",
      "type": "factual",
      "verified": true,
      "evidence": "field_info.json 中数到 12 个字段"
    },
    {
      "claim": "All required fields were populated",
      "type": "quality",
      "verified": false,
      "evidence": "Reference section 留空，但输入中有可用数据"
    }
  ],
  "user_notes_summary": {
    "uncertainties": ["使用了 2023 数据，可能不是最新"],
    "needs_review": [],
    "workarounds": ["非可填写字段改用 text overlay"]
  },
  "eval_feedback": {
    "suggestions": [
      {
        "assertion": "The output includes the name 'John Smith'",
        "reason": "一个幻觉文档只要提到这个名字也会通过；建议检查它是否作为 primary contact 出现，并与输入中的电话和 email 匹配"
      },
      {
        "reason": "没有 assertion 检查抽取出的电话号码是否匹配输入；我观察到输出中有错误号码但没有被抓到"
      }
    ],
    "overall": "Assertions 主要检查存在性，没有检查正确性。建议加入内容验证。"
  }
}
\`\`\``,
  }),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
