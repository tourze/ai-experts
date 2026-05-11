import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { speckitBaselineSkill } from "../speckit-baseline/index";

export const speckitPlanSkill = defineSkill({
  id: "speckit-plan",
  fullName: "Speckit Plan",
  description: "当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。",
  useCases: [
    "当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  relatedSkills: [
    {
      get skill() {
        return speckitBaselineSkill;
      },
      reason: "缺少 `.specify/` scripts 或 templates，需要先初始化 Speckit 基线时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "确保 `.specify/scripts/setup-plan.mjs` 存在；若缺失，先调用 `speckit-baseline` skill 完成 `.specify/` 初始化，完成后回到本流程。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "运行：`node .specify/scripts/setup-plan.mjs --json`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: `读取：
   - \`spec.md\`
   - \`.specify/memory/constitution.md\`
   - \`plan-template.md\``,
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "填写技术上下文：语言、框架、存储、集成、约束、风险。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "Phase 0 研究：消除 `待澄清` 项。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "Phase 1 设计：产出 `data-model.md`、`contracts/`、`quickstart.md`。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "再做一次宪章对齐检查并输出结论。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`plan.md`",
      "`research.md`（如需要）",
      "`data-model.md`",
      "`contracts/*`",
      "`quickstart.md`",
    ],
  }),
});
