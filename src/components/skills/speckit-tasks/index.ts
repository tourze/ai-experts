import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { speckitBaselineSkill } from "../speckit-baseline/index";

export const speckitTasksSkill = defineSkill({
  id: "speckit-tasks",
  fullName: "Speckit Tasks",
  description: "当用户要从规格和技术计划拆出任务清单、依赖顺序、并行标记或故事级任务时使用。",
  useCases: [
    "当用户要从规格和技术计划拆出任务清单、依赖顺序、并行标记或故事级任务时使用。",
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
        label: "确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先调用 `speckit-baseline` skill 完成 `.specify/` 初始化，完成后回到本流程。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "运行：`node .specify/scripts/check-prerequisites.mjs --json`",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "读取：`plan.md`、`spec.md`，并按需读取 `data-model.md`、`contracts/`、`research.md`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: `以用户故事为单位生成任务阶段：
   - Setup
   - Foundation
   - Story P1/P2/P3
   - Polish`,
      }),
      defineWorkflowStep({
        id: "step-5",
        label: `每个任务必须包含：
   - 唯一编号
   - 明确文件路径
   - 验收标准
   - 依赖关系`,
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "确保每个故事可独立验证。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    body: "写入 `tasks.md`，并附并行执行建议。",
  }),
});
