import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineWorkflow,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { engineeringRetroSkill } from "../../skills/engineering-retro/index";
import { authorContributionsSkill } from "../../skills/author-contributions/index";
import { gitAdvancedWorkflowsSkill } from "../../skills/git-advanced-workflows/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const gitHistorianAgent = defineAgent({
  id: "git-historian",
  description: "当需要只读分析 git 历史、贡献模式、代码演化、热点文件和分支拓扑时使用。",
  role: `你是资深 Git 历史分析工程师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Git 历史报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "摘要",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "分析范围",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "热点分析",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "贡献分布",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "演化时间线",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "风险信号",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "洞察与建议",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "每个结论必须有 commit、计数或日期范围支撑。",
    "作者统计必须中性呈现，不能评价个人绩效。",
    "始终声明时间范围和路径范围。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: engineeringRetroSkill.id,
      mode: SkillUseMode.Preload,
      reason: "分析工程活动回溯数据，还原代码演化脉络。",
    },
    {
      id: authorContributionsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "统计作者贡献分布，识别热点区域。",
    },
    {
      id: gitAdvancedWorkflowsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "解读分支拓扑、合并策略和高级 Git 操作痕迹。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条结论有 commit 或日期范围支撑。",
    }
  ],
});
