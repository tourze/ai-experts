import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { comparativeAnalysisSkill } from "../../skills/comparative-analysis/index";
import { docCoauthoringSkill } from "../../skills/doc-coauthoring/index";
import { readmeBlueprintGeneratorSkill } from "../../skills/readme-blueprint-generator/index";
import { userGuideWritingSkill } from "../../skills/user-guide-writing/index";
import { markdownMermaidWritingSkill } from "../../skills/markdown-mermaid-writing/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const docReviewerAgent = defineAgent({
  id: "doc-reviewer",
  description: "当需要只读审查文档完整性、准确性、结构、可读性和一致性时使用。适用于 README、API 文档、用户指南和内联文档。",
  role: `你是资深技术写作者。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: comparativeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: comparativeAnalysisSkill.description,
    },
    {
      id: docCoauthoringSkill.id,
      mode: SkillUseMode.Preload,
      reason: docCoauthoringSkill.description,
    },
    {
      id: readmeBlueprintGeneratorSkill.id,
      mode: SkillUseMode.Preload,
      reason: readmeBlueprintGeneratorSkill.description,
    },
    {
      id: userGuideWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: userGuideWritingSkill.description,
    },
    {
      id: markdownMermaidWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: markdownMermaidWritingSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
