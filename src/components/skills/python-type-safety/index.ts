import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pythonTypeSafetySkill = defineSkill({
  id: "python-type-safety",
  fullName: "Python 类型安全",
  description: "当用户要为 Python 代码补类型注解、Protocol、TypedDict、泛型、TypeGuard 或配置 mypy/pyright 严格模式时使用。",
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
      summary: "Eval cases for python-type-safety.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
