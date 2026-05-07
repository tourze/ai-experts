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


export const evalPostHocAnalyzerAgent = defineAgent({
  id: "eval-post-hoc-analyzer",
  description: "当盲评比较完成后需要揭盲分析胜者优势、败者弱点和改进建议时使用。它读取比较结果、两个 skill 和两个 transcript，产出结构化改进建议。",
  role: `你是 Post-hoc Analyzer。分析盲评比较结果，解释胜者为什么赢，并生成可执行的改进建议。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  inputs: [
    defineAgentInput({ name: "winner", description: "来自 blind comparison 的 `A` 或 `B`。" }),
    defineAgentInput({ name: "winner_skill_path", description: "产出胜者结果的 skill 路径。" }),
    defineAgentInput({ name: "winner_transcript_path", description: "胜者执行 transcript 路径。" }),
    defineAgentInput({ name: "loser_skill_path", description: "产出败者结果的 skill 路径。" }),
    defineAgentInput({ name: "loser_transcript_path", description: "败者执行 transcript 路径。" }),
    defineAgentInput({ name: "comparison_result_path", description: "Blind Comparator 输出 JSON 路径。" }),
    defineAgentInput({ name: "output_path", description: "分析结果保存路径。" }),
  ],
  workflow: defineAgentWorkflow({
    steps: [
      defineAgentWorkflowStep({ id: "read-comparison", label: "读取 comparison 结果，记录胜者、理由和分数" }),
      defineAgentWorkflowStep({ id: "read-skills", label: "读取胜者和败者 skill 及关键引用文件，识别结构差异" }),
      defineAgentWorkflowStep({ id: "read-transcripts", label: "读取两个 transcript，比较执行模式、工具使用和偏离点" }),
      defineAgentWorkflowStep({ id: "score-instruction-following", label: "评估双方是否遵守明确指令并打 1-10 分" }),
      defineAgentWorkflowStep({ id: "identify-strengths", label: "识别胜者优势及其因果证据" }),
      defineAgentWorkflowStep({ id: "identify-weaknesses", label: "识别败者弱点及其对结果的影响" }),
      defineAgentWorkflowStep({ id: "suggest-improvements", label: "按影响优先级生成可执行改进建议" }),
      defineAgentWorkflowStep({ id: "write-analysis", label: "将结构化分析保存到 output_path" }),
    ],
  }),
  qualityStandards: [
    "聚焦 skill 改进：建议必须指向败者 skill 的指令、工具、示例、错误处理、结构或 references。",
    "每条建议要具体、可执行，并解释为什么可能改变比较结果或提升泛化质量。",
    "按 high / medium / low 标注优先级；high 表示很可能改变这次比较结果。",
    "建议分类使用 instructions、tools、examples、error_handling、structure、references。",
    "引用 skill 和 transcript 的具体证据，不重新评分，不批评 agent。",
  ],
  outputFormat: defineAgentOutputFormat({
    kind: "json",
    example: {
      comparison_summary: {
        winner: "A",
        winner_skill: "path/to/winner/skill",
        loser_skill: "path/to/loser/skill",
        comparator_reasoning: "简述 comparator 为什么选择胜者",
      },
      winner_strengths: [
        "多页文档处理步骤清晰",
        "包含 validation script，能发现格式错误",
        "明确说明 OCR 失败时的 fallback 行为",
      ],
      loser_weaknesses: [
        "“process the document appropriately” 这类模糊指令导致行为不稳定",
        "没有 validation script，agent 只能临时判断并漏掉错误",
        "没有 OCR 失败处理，遇到困难输入时过早放弃",
      ],
      instruction_following: {
        winner: {
          score: 9,
          issues: [
            "轻微问题：跳过了可选 logging 步骤",
          ],
        },
        loser: {
          score: 6,
          issues: [
            "没有使用 skill 的格式模板",
            "自行发明流程而不是执行 step 3",
            "漏掉了 “always validate output” 指令",
          ],
        },
      },
      improvement_suggestions: [
        {
          priority: "high",
          category: "instructions",
          suggestion: "把 “process the document appropriately” 改成明确步骤：1) Extract text, 2) Identify sections, 3) Format per template",
          expected_impact: "能消除导致行为不一致的歧义",
        },
        {
          priority: "high",
          category: "tools",
          suggestion: "添加类似胜者 skill 的 validate_output.py",
          expected_impact: "能在最终输出前发现格式错误",
        },
        {
          priority: "medium",
          category: "error_handling",
          suggestion: "加入 fallback 指令：OCR 失败时依次尝试不同分辨率、图像预处理、人工抽取",
          expected_impact: "能避免困难文档上过早失败",
        },
      ],
      transcript_insights: {
        winner_execution_pattern: "读取 skill -> 执行 5 步流程 -> 使用 validation script -> 修复 2 个问题 -> 产出结果",
        loser_execution_pattern: "读取 skill -> 不确定方法 -> 尝试 3 种路径 -> 没有验证 -> 输出有错误",
      },
    },
  }),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
