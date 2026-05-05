import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const laravelSecuritySkill = defineSkill({
  id: "laravel-security",
  description: "当用户提到 Laravel 安全、Sanctum、Policy、FormRequest、文件上传安全、CORS、安全头或密钥管理时使用。",
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
      summary: "Eval cases for laravel-security.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
