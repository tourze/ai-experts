import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "创建、维护和校验 OpenAPI 3.1 规范，覆盖路径、参数、认证、响应、错误模型、共享 schema、示例和代码优先生成流程。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标版本、服务器地址、认证方式、路径操作、错误模型和是否需要 SDK / mock / 契约测试。",
      "为每个 operation 写清 `operationId`、参数、请求体、成功响应、错误响应和共享 schema。",
      "大型规范拆分 `components` 与 `paths`，示例、枚举、默认值必须与 schema 一致。",
      "基础 OpenAPI 3.1 骨架读取 `openapi-skeleton`；代码优先和工具链读取 `code-first-and-tooling`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "OpenAPI 3.1 规范骨架、路径操作、认证、schema 和错误模型。",
      "共享 components、示例一致性、拆分策略和 CI 校验建议。",
      "代码优先生成、SDK / mock / 契约测试工具链建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "openapi-skeleton",
      source: new URL("./references/openapi-skeleton.md", import.meta.url),
      target: "references/openapi-skeleton.md",
      title: "OpenAPI 3.1 基础骨架",
      summary: "OpenAPI 3.1 info、servers、paths、operationId、responses 和 components.schemas 示例。",
      loadWhen: "需要快速创建 OpenAPI 3.1 规范骨架时读取。",
    }),
    defineReference({
      id: "code-first-and-tooling",
      source: new URL("./references/code-first-and-tooling.md", import.meta.url),
      target: "references/code-first-and-tooling.md",
      title: "code-first-and-tooling.md",
      summary: "Code-First 方式生成 OpenAPI 规范的方案，及相关工具链的配置和用法。",
      loadWhen: "需要从代码自动生成 OpenAPI 规范或选择适合的工具链时读取。",
    }),
  ],
});
