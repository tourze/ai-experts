import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { businessModelSkill } from "../business-model/index";
import { evidenceQualityFrameworkSkill } from "../evidence-quality-framework/index";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { mckinseyStepSkill } from "../mckinsey-7-step/index";

export const structuredBusinessAnalysisFrameworkSkill = defineSkill({
  id: "structured-business-analysis-framework",
  fullName: "结构化商业分析框架",
  description: "当需要把开放式商业问题转成结构化分析时使用：从 5W2H 问题界定、MECE 假设树、证据分层（事实/推断/假设）、按问题类型选择分析模型，到设计最小验证计划与可执行建议。与 mckinsey-7-step 互补：后者给七步流程框架，本 skill 给每步的具体方法与模板。",
  useCases: [
    "收到\"业绩为什么下滑\"\"该不该进这个市场\"等开放式商业问题",
    "需要把模糊问题拆成可验证的 MECE 假设树",
    "需要在多个分析框架中做选择（PESTEL/五力/3C/BMC/4P/记分卡）",
    "需要区分事实、推断和假设，把分析结论的可信度显式标出来",
  ],
  constraints: [
    "先用 5W2H 收敛问题边界，再进入 MECE 假设树和模型选择。",
    "假设必须可证伪；不可验证的口号不能作为二级假设。",
    "每个发现必须标注事实、推断、假设或待确认，禁止把推断写成事实。",
    "模型按问题类型选择，不按清单堆框架；未使用的相邻模型要写排除理由。",
    "P0 假设必须有数据来源、验证方法、通过标准和反证信号。",
  ],
  checklist: [
    "问题界定包含 5W2H 七个维度，有明确的\"不回答什么\"。",
    "假设树一级分支 MECE，每个二级假设可验证。",
    "每个发现标注了证据级别（事实/推断/假设/待确认）。",
    "模型选择说明了选 A 的理由和不选 B/C/D 的理由。",
    "P0 假设有完整验证计划（数据来源/方法/通过标准/反证信号）。",
    "行动建议 ≤3 条，每条有验证指标和停止条件。",
  ],
  relatedSkills: [
    {
      get id() {
        return businessModelSkill.id;
      },
      reason: "问题落在商业模式、价值主张、收入结构或 BMC 分析时联动。",
    },
    {
      get id() {
        return mckinseyStepSkill.id;
      },
      reason: "需要七步问题解决法的完整项目节奏和汇报结构时联动。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "需要先剥离类比、行业惯例或隐含前提时联动。",
    },
    {
      get id() {
        return evidenceQualityFrameworkSkill.id;
      },
      reason: "需要更严格的证据质量、来源可信度或结论置信度标注时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "用 5W2H 定义 Why、What、Who、Where、When、How、How much，明确回答什么和不回答什么。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "构建 MECE 假设树：一级分支互不重叠且覆盖问题空间，二级假设每条可验证。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按 P0/P1/P2 标注假设优先级：>30% 解释力、10-30%、<10%。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "对每个发现标注事实、推断、假设或待确认，并写明来源或缺口。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "按问题类型选模型：宏观 PESTEL、行业五力、竞争 3C、商业模式 BMC、经营健康度记分卡、营销 4P。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "为 P0 假设写最小验证计划：假设、数据来源、验证方法、通过标准、反证信号。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "最终行动建议不超过 3 条，每条带验证指标和停止条件。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "问题界定：5W2H、范围内/范围外、决策者、时间窗、资源和行动阈值。",
      "分析骨架：MECE 假设树、证据分层表、模型选择和排除理由。",
      "验证与建议：P0 假设验证计划、反证信号、≤3 条行动建议、指标和停止条件。",
    ],
  }),
});
