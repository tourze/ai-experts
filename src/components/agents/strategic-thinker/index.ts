import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../../skills/first-principles-decomposer/index";
import { scpAnalysisSkill } from "../../skills/scp-analysis/index";
import { whatIfOracleSkill } from "../../skills/what-if-oracle/index";
import { crossPollinationEngineSkill } from "../../skills/cross-pollination-engine/index";
import { consciousnessCouncilSkill } from "../../skills/consciousness-council/index";
import { grillMeSkill } from "../../skills/grill-me/index";
import { priorityJudgeSkill } from "../../skills/priority-judge/index";
import { scientificBrainstormingSkill } from "../../skills/scientific-brainstorming/index";
import { thinkingPartnerSkill } from "../../skills/thinking-partner/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const strategicThinkerAgent = defineAgent({
  id: "strategic-thinker",
  description: "当复杂决策需要多视角战略思考时使用。它结合第一性原理、反向思考、情景分析、跨域类比、优先级判断和对抗式验证。",
  role: `你是资深战略思考伙伴。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "战略思考分析：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "问题重构",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "假设审计",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "失败模式地图",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "选项空间",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "情景投射",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "多视角综合",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "跨框架综合",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "建议",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "不能跳过假设审计。",
    "反向思考是必做步骤。",
    "至少提供一个非显然跨域类比。",
    "建议必须包含改变主意的触发条件。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: firstPrinciplesDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: firstPrinciplesDecomposerSkill.description,
    },
    {
      id: scpAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: scpAnalysisSkill.description,
    },
    {
      id: whatIfOracleSkill.id,
      mode: SkillUseMode.Preload,
      reason: whatIfOracleSkill.description,
    },
    {
      id: crossPollinationEngineSkill.id,
      mode: SkillUseMode.Preload,
      reason: crossPollinationEngineSkill.description,
    },
    {
      id: consciousnessCouncilSkill.id,
      mode: SkillUseMode.Preload,
      reason: consciousnessCouncilSkill.description,
    },
    {
      id: grillMeSkill.id,
      mode: SkillUseMode.Preload,
      reason: grillMeSkill.description,
    },
    {
      id: priorityJudgeSkill.id,
      mode: SkillUseMode.Preload,
      reason: priorityJudgeSkill.description,
    },
    {
      id: scientificBrainstormingSkill.id,
      mode: SkillUseMode.Preload,
      reason: scientificBrainstormingSkill.description,
    },
    {
      id: thinkingPartnerSkill.id,
      mode: SkillUseMode.Preload,
      reason: thinkingPartnerSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
