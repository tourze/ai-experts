import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const openapiSpecGenerationSkill = defineSkill({
  id: "openapi-spec-generation",
  fullName: "OpenAPI 规范生成",
  description: "当用户要创建、维护或校验 OpenAPI 3.1 规范时使用。",
  useCases: [
    "从零编写 OpenAPI 3.1 规范。",
    "从现有 API 实现反推出契约文档。",
    "为 SDK、Mock、文档站或契约测试提供统一源文件。",
  ],
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
  ],
});
