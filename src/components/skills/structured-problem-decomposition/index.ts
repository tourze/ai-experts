import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
} from "../../sdk";
import { businessHealthDiagnosticSkill } from "../business-health-diagnostic/index";
import { debugMethodologySkill } from "../debug-methodology/index";
import { evidenceQualityFrameworkSkill } from "../evidence-quality-framework/index";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { fishboneDiagramSkill } from "../fishbone-diagram/index";
import { mckinseyStepSkill } from "../mckinsey-7-step/index";
import { pdcaCycleSkill } from "../pdca-cycle/index";
import { planningUnderUncertaintySkill } from "../planning-under-uncertainty/index";
import { processOptimizationSkill } from "../process-optimization/index";
import { runningDecisionProcessesSkill } from "../running-decision-processes/index";
import { structuredBusinessAnalysisFrameworkSkill } from "../structured-business-analysis-framework/index";
import { systemsThinkingSkill } from "../systems-thinking/index";

export const structuredProblemDecompositionSkill = defineSkill({
  id: "structured-problem-decomposition",
  fullName: "结构化问题拆解编排",
  description: "当需要把复杂模糊问题系统性拆解为可执行行动路径时使用——从问题界定、结构化拆解、根因分析、系统动态识别、决策推进到 PDCA 改进闭环的六阶段编排流程。与 mckinsey-7-step（流程框架）、fishbone-diagram（根因工具）、first-principles-decomposer（假设挑战）互补：本 skill 给端到端编排逻辑和各阶段过渡标准。",
  useCases: [
    "问题模糊，需要先界定再拆解",
    "涉及多个可能根因，需要系统性排除",
    "需要从分析推进到决策再到执行闭环",
    "涉及多方利益、反馈回路或二阶效应",
  ],
  constraints: [
    "只用于复杂、模糊、跨根因或跨决策的问题；问题已明确时直接使用对应专项框架。",
    "纯技术调试且已有 stack trace、日志或复现路径时，优先转入调试方法，不用业务问题拆解流程。",
    "每个根因候选必须标注事实/推断/假设和反证方式，不可证伪的归因只能作为待验证假设。",
    "阶段过渡必须满足过渡标准，不允许为了显得完整而堆叠所有框架。",
    "决策建议必须有决策人、时间窗、触发条件和回退策略。",
  ],
  checklist: [
    "问题是否能用一句话说明回答什么、不回答什么。",
    "每个 P0 假设是否有验证方式和反证条件。",
    "根因证据强度是否达到事实，或已显式降级为推断/假设。",
    "是否识别反馈回路、二阶效应或流程/组织因素。",
    "建议是否可触发、可回退，并有 PDCA 检查点。",
  ],
  relatedSkills: [
    {
      get id() {
        return mckinseyStepSkill.id;
      },
      reason: "需要从问题定义、MECE 拆解、优先级和行动建议推进七步法时联动。",
    },
    {
      get id() {
        return structuredBusinessAnalysisFrameworkSkill.id;
      },
      reason: "需要用 MECE 假设树、业务结构或咨询框架做结构化拆解时联动。",
    },
    {
      get id() {
        return fishboneDiagramSkill.id;
      },
      reason: "需要按人、机、料、法、环等维度展开根因候选时联动。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "需要挑战默认假设、回到约束和物理/业务基本事实时联动。",
    },
    {
      get id() {
        return systemsThinkingSkill.id;
      },
      reason: "需要识别反馈回路、延迟效应、杠杆点和二阶后果时联动。",
    },
    {
      get id() {
        return evidenceQualityFrameworkSkill.id;
      },
      reason: "需要把根因、结论和建议显式标注为事实/推断/假设并绑定证据时联动。",
    },
    {
      get id() {
        return processOptimizationSkill.id;
      },
      reason: "需要从流程瓶颈、交接、返工和吞吐角度解释系统动态时联动。",
    },
    {
      get id() {
        return businessHealthDiagnosticSkill.id;
      },
      reason: "问题跨增长、交付、现金流、组织或客户健康度时联动。",
    },
    {
      get id() {
        return runningDecisionProcessesSkill.id;
      },
      reason: "需要把分析推进成可执行决策、责任人和会议流程时联动。",
    },
    {
      get id() {
        return planningUnderUncertaintySkill.id;
      },
      reason: "需要在高不确定性下给出选项、触发条件和回退策略时联动。",
    },
    {
      get id() {
        return pdcaCycleSkill.id;
      },
      reason: "需要把决策落到执行、检查、复盘和改进闭环时联动。",
    },
    {
      get id() {
        return debugMethodologySkill.id;
      },
      reason: "问题实际是技术故障、已有日志/堆栈/复现路径，需要证据驱动调试时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "框架堆叠：一次性套完所有方法，阶段之间没有过渡标准。",
      pass: "按问题状态选择下一阶段，满足过渡标准后再切换框架。",
    }),
    defineAntiPattern({
      fail: "不可证伪归因：把“文化不好”“执行力差”当根因。",
      pass: "降级为假设，给出可观察证据、反例和最小验证路径。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "frame-problem",
        label: "问题界定：用一句话说明回答什么、不回答什么；说不清时先收敛范围。",
      }),
      defineWorkflowStep({
        id: "structure-hypotheses",
        label: "结构化拆解：建立 MECE 假设树，确保每个 P0 假设都有验证方式。",
      }),
    ],
    gates: [
      defineWorkflowGate({
        id: "evidence-gate",
        skill: evidenceQualityFrameworkSkill.id,
        label: "证据门禁：根因候选和阶段结论必须标注事实/推断/假设。",
        checks: "事实有定位，推断有依据链，假设有最小验证路径；不可证伪归因不得升级为事实。",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "debug-route",
        triggers: ["已有日志/堆栈/复现路径", "问题本质是技术故障"],
        skill: debugMethodologySkill.id,
        checks: "先收敛可复现事实、观察点和最小验证，不套业务问题拆解框架。",
        output: "复现路径、关键观察、候选根因和下一步实验。",
      }),
      defineWorkflowRoute({
        id: "root-cause-route",
        triggers: ["根因候选分散", "需要按人机料法环展开"],
        skill: fishboneDiagramSkill.id,
        checks: "根因维度不遗漏关键系统因素，每个候选都有反证方式。",
        output: "鱼骨图维度、候选根因、证据强度和排除路径。",
      }),
      defineWorkflowRoute({
        id: "assumption-route",
        triggers: ["默认假设太多", "需要挑战第一性约束"],
        skill: firstPrinciplesDecomposerSkill.id,
        checks: "把默认判断拆回可验证事实、约束和不可变条件。",
        output: "关键假设、底层事实、约束和可验证推论。",
      }),
      defineWorkflowRoute({
        id: "system-route",
        triggers: ["存在反馈回路", "跨团队流程或二阶影响明显"],
        skill: systemsThinkingSkill.id,
        checks: "识别延迟、杠杆点、局部优化副作用和修 A 影响 B 的路径。",
        output: "反馈回路、杠杆点、二阶风险和系统性干预点。",
      }),
      defineWorkflowRoute({
        id: "decision-route",
        triggers: ["需要形成决策", "需要责任人和时间窗"],
        skill: runningDecisionProcessesSkill.id,
        checks: "选项、决策人、时间窗、触发条件和回退策略明确。",
        output: "决策建议、责任人、时间窗、触发条件和回退策略。",
      }),
      defineWorkflowRoute({
        id: "pdca-route",
        triggers: ["已选方案需要落地", "需要检查点和改进闭环"],
        skill: pdcaCycleSkill.id,
        checks: "行动、负责人、指标、检查频率和兜底方案可执行。",
        output: "PDCA 行动表、检查点、指标和复盘节奏。",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "compose-result",
        label: "收束输出：合并六阶段状态、路由产物、未验证假设、系统性风险和下一步验证计划；阶段细节需要时读取 six-phases。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "六阶段状态表：当前阶段、调用框架、过渡标准、红旗和是否可跳阶段。",
      "根因候选、证据强度、反证方式、反馈回路和系统性风险。",
      "决策建议、负责人、时间窗、回退策略、PDCA 检查点和后续验证计划。",
    ],
  }),
  references: [
    defineReference({
      id: "six-phases",
      source: new URL("./references/six-phases.md", import.meta.url),
      target: "references/six-phases.md",
      title: "six-phases.md",
      summary: "结构化问题拆解的六阶段流程详解，包含问题界定、拆解、根因分析、系统动态、决策推进和 PDCA 闭环。",
      loadWhen: "需要了解六阶段编排流程的详细步骤和各阶段过渡标准时读取。",
    }),
  ],
});
