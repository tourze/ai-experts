import {
  AgentSandbox,
  defineAgent,
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
  body: new URL("./AGENT.body.md", import.meta.url),
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
      reason: engineeringRetroSkill.description,
    },
    {
      id: authorContributionsSkill.id,
      mode: SkillUseMode.Preload,
      reason: authorContributionsSkill.description,
    },
    {
      id: gitAdvancedWorkflowsSkill.id,
      mode: SkillUseMode.Preload,
      reason: gitAdvancedWorkflowsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
