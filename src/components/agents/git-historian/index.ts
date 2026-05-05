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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: engineeringRetroSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: authorContributionsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: gitAdvancedWorkflowsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
