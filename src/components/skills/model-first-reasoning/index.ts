import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
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
    "相关资源：[MODEL_TEMPLATE.json](MODEL_TEMPLATE.json)、[scripts/validate-model.mjs](scripts/validate-model.mjs)。",
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
    "是否已经运行 [scripts/validate-model.mjs](scripts/validate-model.mjs)。",
  ],
  relatedSkills: [
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "相关 skill：`llm-evaluation`、`prompt-engineering-patterns`。",
    },
    {
      get id() {
        return promptEngineeringPatternsSkill.id;
      },
      reason: "相关 skill：`llm-evaluation`、`prompt-engineering-patterns`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "validate-model",
      entry: new URL("./scripts/validate-model.mjs", import.meta.url),
      target: "scripts/validate-model.mjs",
      runtime: "node",
      bundle: false,
      description: "Script validate-model.mjs.",
    })
  ],
});
