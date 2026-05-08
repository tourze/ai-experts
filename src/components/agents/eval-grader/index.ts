import {
  AgentSandbox,
  defineAgent,
  defineAgentInput,
  defineAgentOutputFormat,
  defineWorkflow,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const evalGraderAgent = defineAgent({
  id: "eval-grader",
  description: "当需要根据执行 transcript 和输出文件评估 expectations 通过或失败时使用。它逐条判定并验证隐含 claims，产出结构化评分结果。",
  role: `你是 Grader。根据执行 transcript 和 outputs 评估 expectations。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  inputs: [
    defineAgentInput({ name: "expectations", description: "要评估的 expectations 列表，字符串数组。" }),
    defineAgentInput({ name: "transcript_path", description: "执行 transcript 的 markdown 文件路径。" }),
    defineAgentInput({ name: "outputs_dir", description: "执行产生的输出文件目录。" }),
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({ id: "read-transcript", label: "完整读取 transcript，记录 eval prompt、执行过程、错误和最终结果" }),
      defineWorkflowStep({ id: "inspect-outputs", label: "列出并读取 outputs_dir 中与 expectations 相关的文件" }),
      defineWorkflowStep({ id: "grade-expectations", label: "为每条 expectation 搜索证据并判定 PASS/FAIL" }),
      defineWorkflowStep({ id: "verify-claims", label: "抽取并验证输出中的事实、过程和质量 claims" }),
      defineWorkflowStep({ id: "read-notes", label: "如存在 user_notes.md，纳入不确定性、需复核事项和绕路方案" }),
      defineWorkflowStep({ id: "assess-eval", label: "评估 assertion 是否太弱或漏掉重要结果" }),
      defineWorkflowStep({ id: "return-grading", label: "返回 grading JSON；调用方负责保存到 outputs_dir 的同级目录" }),
      defineWorkflowStep({ id: "include-metrics", label: "如存在 metrics.json 或 timing.json，合并执行指标和耗时" }),
    ],
  }),
  qualityStandards: [
    "PASS 必须有 transcript 或 outputs 的清楚证据，且证据体现真实任务完成，而不是表层合规。",
    "FAIL 包括找不到证据、证据相反、现有信息无法验证、表层满足但底层结果错误或不完整。",
    "不确定时，通过的举证责任在 expectation 一方；每条 expectation 只有 pass 或 fail，没有部分分。",
    "同时检查 transcript 和输出文件，不要只相信 transcript 里声称产出了什么。",
    "发现 assertion 太容易满足、重要结果未覆盖或无法验证时，在 eval_feedback 中提出具体改进建议。",
  ],
  outputFormat: defineAgentOutputFormat({
    kind: "json",
    example: {
      expectations: [
        {
          text: "The output includes the name 'John Smith'",
          passed: true,
          evidence: "在 transcript Step 3 中发现：'Extracted names: John Smith, Sarah Johnson'",
        },
        {
          text: "The spreadsheet has a SUM formula in cell B10",
          passed: false,
          evidence: "没有创建 spreadsheet；输出是一个 text file。",
        },
        {
          text: "The assistant used the skill's OCR script",
          passed: true,
          evidence: "Transcript Step 2 显示：'Tool: Bash - python ocr_script.py image.png'",
        },
      ],
      summary: {
        passed: 2,
        failed: 1,
        total: 3,
        pass_rate: 0.67,
      },
      execution_metrics: {
        tool_calls: {
          Read: 5,
          Write: 2,
          Bash: 8,
        },
        total_tool_calls: 15,
        total_steps: 6,
        errors_encountered: 0,
        output_chars: 12450,
        transcript_chars: 3200,
      },
      timing: {
        executor_duration_seconds: 165,
        grader_duration_seconds: 26,
        total_duration_seconds: 191,
      },
      claims: [
        {
          claim: "The form has 12 fillable fields",
          type: "factual",
          verified: true,
          evidence: "field_info.json 中数到 12 个字段",
        },
        {
          claim: "All required fields were populated",
          type: "quality",
          verified: false,
          evidence: "Reference section 留空，但输入中有可用数据",
        },
      ],
      user_notes_summary: {
        uncertainties: ["使用了 2023 数据，可能不是最新"],
        needs_review: [],
        workarounds: ["非可填写字段改用 text overlay"],
      },
      eval_feedback: {
        suggestions: [
          {
            assertion: "The output includes the name 'John Smith'",
            reason: "一个幻觉文档只要提到这个名字也会通过；建议检查它是否作为 primary contact 出现，并与输入中的电话和 email 匹配",
          },
          {
            reason: "没有 assertion 检查抽取出的电话号码是否匹配输入；我观察到输出中有错误号码但没有被抓到",
          },
        ],
        overall: "Assertions 主要检查存在性，没有检查正确性。建议加入内容验证。",
      },
    },
  }),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
