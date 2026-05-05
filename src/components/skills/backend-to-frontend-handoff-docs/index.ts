import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const backendToFrontendHandoffDocsSkill = defineSkill({
  id: "backend-to-frontend-handoff-docs",
  description: "当后端接口完成后用户要为前端生成 API 交接材料、DTO 语义、状态码、校验规则或边界场景说明时使用。",
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
      summary: "Eval cases for backend-to-frontend-handoff-docs.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
