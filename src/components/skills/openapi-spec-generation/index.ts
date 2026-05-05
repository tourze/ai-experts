import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  constraints: [
    "目标版本默认为 OpenAPI 3.1.0，除非项目已有明确约束。",
    "路径、参数、响应和错误模型必须显式建模，不能只写 happy path。",
    "示例数据要与 schema 一致，避免文档可读但不可用。",
    "大型规范优先拆分 `components` 与 `paths`，避免单文件失控。",
  ],
  checklist: [
    "是否定义了版本、服务器地址、认证方式和错误响应模型。",
    "是否为每个 path operation 提供 `operationId`、参数和响应码。",
    "是否复用了共享 schema、参数和 response 组件。",
    "是否让示例、默认值和枚举值与 schema 保持一致。",
    "如果 API 生成流程嵌入 CI，参阅 GitHub Actions 工作流配置相关文档。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只写 200 无错误模型",
      pass: "覆盖错误模型",
    }),
    defineAntiPattern({
      fail: "字段重复定义漂移",
      pass: "共享 schema 组件",
    }),
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
