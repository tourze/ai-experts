import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { comparativeAnalysisSkill } from "../../skills/comparative-analysis/index.js";
import { docCoauthoringSkill } from "../../skills/doc-coauthoring/index.js";
import { readmeBlueprintGeneratorSkill } from "../../skills/readme-blueprint-generator/index.js";
import { userGuideWritingSkill } from "../../skills/user-guide-writing/index.js";
import { markdownMermaidWritingSkill } from "../../skills/markdown-mermaid-writing/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const docReviewerAgent = defineAgent({
  id: "doc-reviewer",
  description: "当需要只读审查文档完整性、准确性、结构、可读性和一致性时使用。适用于 README、API 文档、用户指南和内联文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: comparativeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: docCoauthoringSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: readmeBlueprintGeneratorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: userGuideWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: markdownMermaidWritingSkill.id,
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
