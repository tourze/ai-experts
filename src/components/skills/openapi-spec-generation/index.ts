import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const openapiSpecGenerationSkill = defineSkill({
  id: "openapi-spec-generation",
  description: "当用户要创建、维护或校验 OpenAPI 3.1 规范时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-first-and-tooling",
      source: new URL("./references/code-first-and-tooling.md", import.meta.url),
      target: "references/code-first-and-tooling.md",
      title: "code-first-and-tooling.md",
      summary: "Reference material for openapi-spec-generation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for openapi-spec-generation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
