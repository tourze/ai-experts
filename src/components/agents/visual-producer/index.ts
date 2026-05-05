import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { canvasDesignSkill } from "../../skills/canvas-design/index.js";
import { baoyuCompressImageSkill } from "../../skills/baoyu-compress-image/index.js";
import { iconRetrievalSkill } from "../../skills/icon-retrieval/index.js";
import { screenshotSkill } from "../../skills/screenshot/index.js";
import { modernWebDesignSkill } from "../../skills/modern-web-design/index.js";
import { algoVisualizationSkill } from "../../skills/algo-visualization/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const visualProducerAgent = defineAgent({
  id: "visual-producer",
  description: "当需要制作视觉资产时使用。它预加载 8 个创意生产框架，从概念、图像/视频生成、图表到压缩交付组织完整视觉流水线。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.Bash, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: canvasDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: baoyuCompressImageSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: iconRetrievalSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: screenshotSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: modernWebDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: algoVisualizationSkill.id,
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
