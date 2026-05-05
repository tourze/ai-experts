import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { deepResearchSkill } from "../../skills/deep-research/index.js";
import { webContentFetcherSkill } from "../../skills/web-content-fetcher/index.js";
import { comparativeAnalysisSkill } from "../../skills/comparative-analysis/index.js";
import { researchNoteWrapSkill } from "../../skills/research-note-wrap/index.js";
import { obsidianBasesSkill } from "../../skills/obsidian-bases/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const researchIntelligenceAnalystAgent = defineAgent({
  id: "research-intelligence-analyst",
  description: "当需要端到端完成外部事实研究、网页正文抓取、多来源对比和研究笔记沉淀时使用。它可以联网检索、读取具体 URL，并在用户指定目录下产出 Markdown 研究报告、来源摘要或 Obsidian 笔记。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: deepResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: webContentFetcherSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: comparativeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: researchNoteWrapSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: obsidianBasesSkill.id,
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
