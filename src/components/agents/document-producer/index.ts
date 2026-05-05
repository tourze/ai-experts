import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "文档交付计划：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "受众与用途",
        body: "[读者画像 / 决策类型 / 阅读场景]",
      }),
      defineAgentOutputSection({
        title: "信息架构",
        body: "[章节 → 论点 → 证据 → 行动项]",
      }),
      defineAgentOutputSection({
        title: "视觉与格式",
        body: "[版式 / 配色 / 字体 / 图表风格]",
      }),
      defineAgentOutputSection({
        title: "已写入文件",
        body: "[路径 → 格式 → 字数 / 页数 / 图数]",
      }),
      defineAgentOutputSection({
        title: "来源与转换链",
        body: "[主稿 → 派生格式的转换路径与脚本]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未生成的格式 / 缺失的素材 / 待用户确认事项]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于运行用户授权的本仓库脚本（如 `markitdown`、`pretty-mermaid`、`md-to-pdf`、Office 转换工具）、读取已有文档与模板、git 历史与文件统计。禁止安装外部依赖、修改业务源码、向云端推送文档或调用收费 API（除非用户已授权）。",
  ],
  qualityStandards: [
    "每个章节必须服务一个明确论点；可删除而不破坏结构则视为冗余。",
    "多格式产出必须共享单一主稿，避免漂移；漂移点须显式标注。",
    "图表优先 Mermaid / PlantUML 源码；只在可读性收益明显时使用静态图。",
    "目录、页码、交叉引用必须可点击或可通过工具自动生成，不允许硬编码。",
    "不修改业务源码或非文档目录；写入路径在交付清单中显式列出。",
  ],
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
