import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { javascriptTypescriptJestSkill } from "../javascript-typescript-jest/index";
import { openapiSpecGenerationSkill } from "../openapi-spec-generation/index";
import { typescriptTypeSafetySkill } from "../typescript-type-safety/index";

export const nestjsLayeringPatternsSkill = defineSkill({
  id: "nestjs-layering-patterns",
  fullName: "NestJS Layering Patterns",
  description: "当需要设计或审查 NestJS 模块分层、DTO/ValidationPipe 输入边界、依赖注入或 Guard/Interceptor/Pipe 装配时使用。",
  useCases: [
    "需要创建、修改或排查 `*.module.ts`、`*.controller.ts`、`*.service.ts`、`dto/*.dto.ts`、Guard、Interceptor、Pipe、Filter。",
    "需要设计 NestJS 模块边界、依赖注入关系、REST/GraphQL 接口、Swagger 文档、认证授权或配置加载。",
    "需要同时处理 `TypeORM`、`Prisma`、`Passport/JWT`、`ConfigModule`、`class-validator`、Jest 单测或 E2E 测试。",
    "需要把 Express/原生 Node.js API 重构为 NestJS 分层结构时，先读 `migration-from-express`。",
    "需要补强类型建模、Jest 细节或 OpenAPI 合同生成时，可联动现有技能 `typescript-type-safety`、`javascript-typescript-jest`、`openapi-spec-generation`。",
  ],
  constraints: [
    "控制器只负责协议层：参数解析、鉴权装饰器、响应码与 Swagger 注解；业务规则放在 Service/Use Case。",
    "所有输入边界都必须通过 DTO + `class-validator` + `ValidationPipe`，禁止把原始 `req.body` 直接传入服务层。",
    "统一使用构造函数注入与 `@Injectable()`；禁止手写 `new Service()` 绕过 Nest 容器。",
    "配置、密钥、端口、第三方地址必须来自 `ConfigModule` 或环境变量；禁止写死在源码与示例里。",
    "Service 层抛出明确的 HTTP/领域异常，避免返回 `null`、魔法字符串或吞异常。",
    "默认要求补单元测试；涉及控制器、路由、认证、全局管道或模块装配时，再补 Controller/E2E 验证。",
  ],
  checklist: [
    "`AppModule` 或模块级入口是否启用了 `ValidationPipe`、必要的 Guard / Interceptor / Filter。",
    "DTO 是否覆盖所有输入边界，是否使用 `readonly`、枚举、嵌套校验与类型转换。",
    "Service 是否只依赖抽象或 provider，不在运行时直接创建外部依赖实例。",
    "控制器是否声明了 `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等 Swagger 注解。",
    "配置、密钥、数据库连接与第三方 SDK 初始化是否全部走配置模块。",
    "新增逻辑是否同时覆盖单测，涉及路由/认证时是否补了控制器或 E2E 测试。",
  ],
  relatedSkills: [
    {
      get id() {
        return typescriptTypeSafetySkill.id;
      },
      reason: "NestJS DTO、泛型 response、配置类型或边界合同需要 TypeScript 收敛时联动。",
    },
    {
      get id() {
        return javascriptTypescriptJestSkill.id;
      },
      reason: "NestJS service、controller 或 E2E 测试需要 Jest 结构和 mock 边界时联动。",
    },
    {
      get id() {
        return openapiSpecGenerationSkill.id;
      },
      reason: "Swagger 装饰器需要沉淀为 OpenAPI 合同或 SDK / mock 源文件时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Controller 操作 Repository",
      pass: "Controller 只做协议层",
    }),
    defineAntiPattern({
      fail: "返回整个 Entity",
      pass: "DTO/ResponseSerializer 隔离",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认触及模块、控制器、服务、DTO、认证授权、配置、数据库和测试中的哪些层。",
      "控制器只处理协议层，Service / Use Case 承载业务规则，输入边界统一走 DTO + ValidationPipe。",
      "依赖通过 provider 和构造函数注入，不手写 `new Service()` 绕过容器；配置和密钥走 ConfigModule。",
      "主题选择表读取 `topic-map`；完整骨架读取 `basic-scaffold`；认证、DTO、测试、迁移按需读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "NestJS 模块、控制器、服务、DTO、Provider 和 Guard / Pipe / Filter 边界设计。",
      "输入校验、依赖注入、配置、异常、Swagger 和测试覆盖建议。",
      "需要参考的 scaffold / testing / migration 资料和最小改动顺序。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "topic-map",
      source: new URL("./references/topic-map.md", import.meta.url),
      target: "references/topic-map.md",
      title: "NestJS 主题参考地图",
      summary: "控制器、服务、DTO、认证、测试、Express 迁移等 NestJS 参考资料的选择表和交付顺序。",
      loadWhen: "需要快速判断 NestJS 问题该读取哪份 reference 时读取。",
    }),
    defineReference({
      id: "authentication",
      source: new URL("./references/authentication.md", import.meta.url),
      target: "references/authentication.md",
      title: "authentication.md",
      summary: "NestJS 认证与授权的实现模式，包括 Passport/JWT、Session 和自定义 Guard。",
      loadWhen: "需要设计或审查 NestJS 应用的认证授权方案时读取。",
    }),
    defineReference({
      id: "basic-scaffold",
      source: new URL("./references/basic-scaffold.md", import.meta.url),
      target: "references/basic-scaffold.md",
      title: "basic-scaffold.md",
      summary: "NestJS 项目的基础脚手架结构和模块划分指南。",
      loadWhen: "需要搭建新 NestJS 项目或理解项目初始目录结构时读取。",
    }),
    defineReference({
      id: "controllers-routing",
      source: new URL("./references/controllers-routing.md", import.meta.url),
      target: "references/controllers-routing.md",
      title: "controllers-routing.md",
      summary: "NestJS 控制器与路由的设计模式，包括参数解析、响应处理和 Swagger 注解。",
      loadWhen: "需要设计 REST/GraphQL 路由、控制器职责划分或 Swagger 文档时读取。",
    }),
    defineReference({
      id: "dtos-validation",
      source: new URL("./references/dtos-validation.md", import.meta.url),
      target: "references/dtos-validation.md",
      title: "dtos-validation.md",
      summary: "NestJS DTO 设计与 ValidationPipe 验证规则的最佳实践。",
      loadWhen: "需要设计输入边界 DTO、配置校验规则或处理复杂验证场景时读取。",
    }),
    defineReference({
      id: "migration-from-express",
      source: new URL("./references/migration-from-express.md", import.meta.url),
      target: "references/migration-from-express.md",
      title: "migration-from-express.md",
      summary: "从 Express/原生 Node.js API 迁移到 NestJS 分层架构的参考指南。",
      loadWhen: "需要将 Express 或原生 Node.js API 重构为 NestJS 分层结构时读取。",
    }),
    defineReference({
      id: "services-di",
      source: new URL("./references/services-di.md", import.meta.url),
      target: "references/services-di.md",
      title: "services-di.md",
      summary: "NestJS 服务层与依赖注入的设计模式，包括 provider 作用域、自定义 provider 和模块封装。",
      loadWhen: "需要设计 Service 层逻辑、管理依赖注入关系或封装模块时读取。",
    }),
    defineReference({
      id: "testing-patterns",
      source: new URL("./references/testing-patterns.md", import.meta.url),
      target: "references/testing-patterns.md",
      title: "testing-patterns.md",
      summary: "NestJS 单元测试和 E2E 测试的编写模式，包括控制器测试、服务测试和模块集成测试。",
      loadWhen: "需要为 NestJS 模块编写单元测试或 E2E 测试时读取。",
    }),
  ],
});
