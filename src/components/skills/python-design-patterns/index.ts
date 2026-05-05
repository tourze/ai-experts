import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const pythonDesignPatternsSkill = defineSkill({
  id: "python-design-patterns",
  description: "当用户要拆分职责、设计服务层、减少耦合、在组合与继承之间做选择，或重构 Python 组件结构时使用。",
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
      summary: "Eval cases for python-design-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
