import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { firstPrinciplesDecomposerSkill } from "../../skills/first-principles-decomposer/index.js";
import { scpAnalysisSkill } from "../../skills/scp-analysis/index.js";
import { whatIfOracleSkill } from "../../skills/what-if-oracle/index.js";
import { crossPollinationEngineSkill } from "../../skills/cross-pollination-engine/index.js";
import { consciousnessCouncilSkill } from "../../skills/consciousness-council/index.js";
import { grillMeSkill } from "../../skills/grill-me/index.js";
import { priorityJudgeSkill } from "../../skills/priority-judge/index.js";
import { scientificBrainstormingSkill } from "../../skills/scientific-brainstorming/index.js";
import { thinkingPartnerSkill } from "../../skills/thinking-partner/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const strategicThinkerAgent = defineAgent({
  id: "strategic-thinker",
  description: "当复杂决策需要多视角战略思考时使用。它结合第一性原理、反向思考、情景分析、跨域类比、优先级判断和对抗式验证。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: firstPrinciplesDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: scpAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: whatIfOracleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: crossPollinationEngineSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: consciousnessCouncilSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: grillMeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: priorityJudgeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: scientificBrainstormingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: thinkingPartnerSkill.id,
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
