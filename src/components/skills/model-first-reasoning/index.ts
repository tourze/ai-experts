import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const modelFirstReasoningSkill = defineSkill({
  id: "model-first-reasoning",
  fullName: "model-first-reasoning",
  description: "当用户明确要求 model-first 或任务涉及状态机、约束系统等需要先建模的场景时使用。",
  useCases: [
    "功能复杂，直接编码容易引入隐含状态、漏掉约束或发明接口。",
    "任务包含显式状态转换、权限矩阵、调度规则、工作流编排、约束求解。",
    "用户要求先建模型、先写约束、先确认 requirement trace，再进入实现阶段。",
    "相关资源：[MODEL_TEMPLATE.json](MODEL_TEMPLATE.json)、[scripts/validate-model.mjs](scripts/validate-model.mjs)。",
    "相关 skill：[llm-evaluation](../llm-evaluation/SKILL.md)、[prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md)。",
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
