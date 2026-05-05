import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { canvasDesignSkill } from "../../skills/canvas-design/index";
import { baoyuCompressImageSkill } from "../../skills/baoyu-compress-image/index";
import { iconRetrievalSkill } from "../../skills/icon-retrieval/index";
import { screenshotSkill } from "../../skills/screenshot/index";
import { modernWebDesignSkill } from "../../skills/modern-web-design/index";
import { algoVisualizationSkill } from "../../skills/algo-visualization/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const visualProducerAgent = defineAgent({
  id: "visual-producer",
  description: "当需要制作视觉资产时使用。它预加载 8 个创意生产框架，从概念、图像/视频生成、图表到压缩交付组织完整视觉流水线。",
  role: `你是资深视觉制作人。你可以在用户请求的交付范围内创建或更新文件，但不要修改无关源码、配置或用户数据。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "视觉生产计划：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "简报",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "风格方向",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "资产流水线",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "生产说明",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "每个资产必须先定义尺寸和格式。",
    "色板必须用 hex 值。",
    "压缩目标必须可量化。",
    "多资产项目必须共享风格系统。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.Bash, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: canvasDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: canvasDesignSkill.description,
    },
    {
      id: baoyuCompressImageSkill.id,
      mode: SkillUseMode.Preload,
      reason: baoyuCompressImageSkill.description,
    },
    {
      id: iconRetrievalSkill.id,
      mode: SkillUseMode.Preload,
      reason: iconRetrievalSkill.description,
    },
    {
      id: screenshotSkill.id,
      mode: SkillUseMode.Preload,
      reason: screenshotSkill.description,
    },
    {
      id: modernWebDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: modernWebDesignSkill.description,
    },
    {
      id: algoVisualizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: algoVisualizationSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
