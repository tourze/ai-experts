import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const modelFirstReasoningSkill = defineSkill({
  id: "model-first-reasoning",
  description: "当用户明确要求 model-first 或任务涉及状态机、约束系统等需要先建模的场景时使用。",
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
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for model-first-reasoning.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
