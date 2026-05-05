import {
  AgentSandbox,
  defineAgent,
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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
