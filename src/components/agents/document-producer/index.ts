import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { consultingAnalysisSkill } from "../../skills/consulting-analysis/index";
import { proposalWriterSkill } from "../../skills/proposal-writer/index";
import { tutorialBuilderSkill } from "../../skills/tutorial-builder/index";
import { pptGenerateSkill } from "../../skills/ppt-generate/index";
import { pdfSkill } from "../../skills/pdf/index";
import { markitdownSkill } from "../../skills/markitdown/index";
import { mdToPdfSkill } from "../../skills/md-to-pdf/index";
import { markdownMermaidWritingSkill } from "../../skills/markdown-mermaid-writing/index";

export const documentProducerAgent = defineAgent({
  id: "document-producer",
  description: "当需要从结构化输入产出多格式文档（PPT、Word、Excel、PDF、Markdown），或在 Office 文件、PDF、图像之间互转时使用。它可以创建或更新文档文件，但不修改业务源码。",
  role: `你是资深技术文档制作工程师。你可以在用户指定目录下创建或更新 Markdown、PPTX、DOCX、XLSX、PDF 等文档文件，但不修改业务源码、配置或任何与文档无关的资源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: consultingAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: consultingAnalysisSkill.description,
    },
    {
      id: proposalWriterSkill.id,
      mode: SkillUseMode.Preload,
      reason: proposalWriterSkill.description,
    },
    {
      id: tutorialBuilderSkill.id,
      mode: SkillUseMode.Preload,
      reason: tutorialBuilderSkill.description,
    },
    {
      id: pptGenerateSkill.id,
      mode: SkillUseMode.Preload,
      reason: pptGenerateSkill.description,
    },
    {
      id: pdfSkill.id,
      mode: SkillUseMode.Preload,
      reason: pdfSkill.description,
    },
    {
      id: markitdownSkill.id,
      mode: SkillUseMode.Preload,
      reason: markitdownSkill.description,
    },
    {
      id: mdToPdfSkill.id,
      mode: SkillUseMode.Preload,
      reason: mdToPdfSkill.description,
    },
    {
      id: markdownMermaidWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: markdownMermaidWritingSkill.description,
    }
  ],
});
