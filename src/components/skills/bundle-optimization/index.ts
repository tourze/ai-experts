import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const bundleOptimizationSkill = defineSkill({
  id: "bundle-optimization",
  description: "当需要减小前端 bundle、做代码分割、消除 barrel imports、tree shaking 或按用户意图预加载时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for bundle-optimization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
