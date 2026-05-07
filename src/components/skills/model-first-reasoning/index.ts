import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, modelFirstReasoningValidateModel } from "../../procedures/index";

import { llmEvaluationSkill } from "../llm-evaluation/index";
import { promptEngineeringPatternsSkill } from "../prompt-engineering-patterns/index";

export const modelFirstReasoningSkill = defineSkill({
  id: "model-first-reasoning",
  fullName: "model-first-reasoning",
  description: "当用户明确要求 model-first 或任务涉及状态机、约束系统等需要先建模的场景时使用。",
  useCases: [
    "功能复杂，直接编码容易引入隐含状态、漏掉约束或发明接口。",
    "任务包含显式状态转换、权限矩阵、调度规则、工作流编排、约束求解。",
    "用户要求先建模型、先写约束、先确认 requirement trace，再进入实现阶段。",
    "相关资源：[MODEL_TEMPLATE.json](MODEL_TEMPLATE.json)、procedure `model-first-reasoning-validate-model`。",
  ],
  constraints: [
    "Phase 1 只产出模型，不写实现代码。",
    "Phase 2 只能在 Phase 1 已冻结的实体、状态、动作、约束内实现；如果模型不够，必须先返回 `MODEL INCOMPLETE`。",
    "每个用户需求都要能映射到 `goal`、`constraint`、`action` 三者之一。",
    "进入编码前必须运行结构校验；`unknowns` 不为空时，停在 Phase 1。",
  ],
  checklist: [
    "用户需求是否都被映射进 `goal` / `constraint` / `action`。",
    "是否存在实现阶段才会冒出来的新实体或新状态。",
    "`unknowns` 是否已经清零。",
    "是否已经运行 procedure `model-first-reasoning-validate-model`。",
  ],
  relatedSkills: [
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "冻结模型后需要把行为合同纳入评测或回归集时联动。",
    },
    {
      get id() {
        return promptEngineeringPatternsSkill.id;
      },
      reason: "模型用于约束 prompt、工具调用或 agent 行为时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "边写代码边补模型",
      pass: "Phase 1 冻结模型再编码",
    }),
    defineAntiPattern({
      fail: "模型不写约束",
      pass: "显式约束",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在编码前先冻结实体、状态、动作、约束和未知项，让复杂状态机或约束系统按模型实现，而不是边写边发明规则。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "Phase 1 只产出模型：deliverable、goals、entities、states、actions、constraints、unknowns 和 requirement trace。",
      "把每条用户需求映射到 `goal`、`constraint` 或 `action`；映射不了就标入 `unknowns`。",
      "运行 `model-first-reasoning-validate-model` 校验结构；`unknowns` 不为空时返回 `MODEL INCOMPLETE`，不进入实现。",
      "Phase 2 只能在冻结模型内实现；发现新实体、新状态或新约束时先回到 Phase 1 更新模型。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "冻结前的模型 JSON、requirement trace、unknowns 和结构校验结果。",
      "`MODEL INCOMPLETE` 时的缺口说明，或允许实现时的模型边界。",
      "实现阶段发现模型不足时的回滚到 Phase 1 的说明。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(modelFirstReasoningValidateModel),
  ],
});
