import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { uxHeuristicsSkill } from "../../skills/ux-heuristics/index";
import { uxResearcherDesignerSkill } from "../../skills/ux-researcher-designer/index";
import { frontendDesignReviewSkill } from "../../skills/frontend-design-review/index";
import { uxWritingSkill } from "../../skills/ux-writing/index";
import { responsiveDesignSkill } from "../../skills/responsive-design/index";
import { i18nLocalizationSkill } from "../../skills/i18n-localization/index";
import { figmaImplementDesignSkill } from "../../skills/figma-implement-design/index";
import { interactionDesignSkill } from "../../skills/interaction-design/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const uxReviewerAgent = defineAgent({
  id: "ux-reviewer",
  description: "当需要审查界面可用性、交互设计质量、信息架构、微文案或设计还原度时使用——覆盖启发式评估、用户研究方法、设计系统一致性、响应式和国际化。只读分析，产出 UX 审查报告。",
  role: `你是资深 UX 设计师和可用性工程师。你只读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: uxHeuristicsSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxHeuristicsSkill.description,
    },
    {
      id: uxResearcherDesignerSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxResearcherDesignerSkill.description,
    },
    {
      id: frontendDesignReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: frontendDesignReviewSkill.description,
    },
    {
      id: uxWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxWritingSkill.description,
    },
    {
      id: responsiveDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: responsiveDesignSkill.description,
    },
    {
      id: i18nLocalizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: i18nLocalizationSkill.description,
    },
    {
      id: figmaImplementDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: figmaImplementDesignSkill.description,
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: interactionDesignSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
