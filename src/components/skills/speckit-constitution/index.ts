import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitConstitutionSkill = defineSkill({
  id: "speckit-constitution",
  fullName: "Speckit Constitution",
  description: "当用户要创建或更新项目宪章、Source of Law、原则版本或模板流程约束时使用。",
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
      summary: "Eval cases for speckit-constitution.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
