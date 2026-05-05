import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { consultingAnalysisSkill } from "../../skills/consulting-analysis/index.js";
import { proposalWriterSkill } from "../../skills/proposal-writer/index.js";
import { tutorialBuilderSkill } from "../../skills/tutorial-builder/index.js";
import { pptGenerateSkill } from "../../skills/ppt-generate/index.js";
import { pdfSkill } from "../../skills/pdf/index.js";
import { markitdownSkill } from "../../skills/markitdown/index.js";
import { mdToPdfSkill } from "../../skills/md-to-pdf/index.js";
import { markdownMermaidWritingSkill } from "../../skills/markdown-mermaid-writing/index.js";

export const documentProducerAgent = defineAgent({
  id: "document-producer",
  description: "当需要从结构化输入产出多格式文档（PPT、Word、Excel、PDF、Markdown），或在 Office 文件、PDF、图像之间互转时使用。它可以创建或更新文档文件，但不修改业务源码。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: consultingAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: proposalWriterSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tutorialBuilderSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pptGenerateSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pdfSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: markitdownSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: mdToPdfSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: markdownMermaidWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
