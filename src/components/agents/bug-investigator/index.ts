import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { chromeDevtoolsSkill } from "../../skills/chrome-devtools/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const bugInvestigatorAgent = defineAgent({
  id: "bug-investigator",
  description: "当需要调查 bug、日志、stack trace 或回归原因时使用。它只读追踪执行路径、提出可证伪假设并定位根因。",
  role: `你是资深调试工程师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Bug 调查报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "症状",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "调查时间线",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "根因",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "促成因素",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "建议修复",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "嫌疑提交",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "置信度",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "每个判断必须引用文件、行号、日志片段或 commit。",
    "不能把假设写成结论；无法确定根因时列出剩余假设和证据。",
    "修复建议必须具体到位置、做法、风险和测试方式。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: debugMethodologySkill.description,
    },
    {
      id: chromeDevtoolsSkill.id,
      mode: SkillUseMode.Preload,
      reason: chromeDevtoolsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
