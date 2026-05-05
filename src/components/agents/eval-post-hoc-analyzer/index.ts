import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const evalPostHocAnalyzerAgent = defineAgent({
  id: "eval-post-hoc-analyzer",
  description: "当盲评比较完成后需要揭盲分析胜者优势、败者弱点和改进建议时使用。它读取比较结果、两个 skill 和两个 transcript，产出结构化改进建议。",
  role: `你是 Post-hoc Analyzer。分析盲评比较结果，解释胜者为什么赢，并生成可执行的改进建议。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "raw",
    body: `写一个 JSON 文件，结构如下：

\`\`\`json
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
\`\`\``,
  }),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
