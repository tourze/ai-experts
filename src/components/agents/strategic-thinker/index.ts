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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "澄清真正问题、约束、决策标准和可逆性。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "审计假设并用第一性原理拆解 framing。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "通过反向思考找失败模式和致命假设。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "用跨域类比与发散思考扩展选项空间。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "用情景分析、多视角辩论和 grill-me 压测最终建议。",
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
      reason: "用第一性原理拆解复杂问题到原子假设。",
    },
    {
      id: scpAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "用 SCP 框架分析产业结构与竞争态势。",
    },
    {
      id: whatIfOracleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "反向思考推演失败模式与触发条件。",
    },
    {
      id: crossPollinationEngineSkill.id,
      mode: SkillUseMode.Preload,
      reason: "跨领域类比生成非显然战略选项。",
    },
    {
      id: consciousnessCouncilSkill.id,
      mode: SkillUseMode.Preload,
      reason: "多角色对抗验证，防止单一视角盲区。",
    },
    {
      id: grillMeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "对抗式追问暴露论证薄弱环节。",
    },
    {
      id: priorityJudgeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "多维度权衡排序战略选项优先级。",
    },
    {
      id: scientificBrainstormingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "结构化发散与收敛生成可行方案。",
    },
    {
      id: thinkingPartnerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "引导深层思考，理清隐含假设与目标。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "标注每条结论的事实/推断/假设层级。",
    }
  ],
});
