import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const laravelVerificationSkill = defineSkill({
  id: "laravel-verification",
  description: "当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时使用。",
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
      summary: "Eval cases for laravel-verification.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
