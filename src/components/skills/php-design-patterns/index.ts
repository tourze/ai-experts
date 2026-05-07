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
import { phpXFeaturesSkill } from "../php-8x-features/index";
import { phpErrorHandlingSkill } from "../php-error-handling/index";
import { phpTypeSafetySkill } from "../php-type-safety/index";

export const phpDesignPatternsSkill = defineSkill({
  id: "php-design-patterns",
  fullName: "PHP 设计模式与分层",
  description: "当用户要拆分 PHP 类职责、设计服务层与 Repository、构建 DTO/值对象、规范依赖注入或让控制器保持薄化时使用。",
  useCases: [
    "新建 service、repository、DTO、值对象等核心组件时需要先定边界。",
    "现有类已经变成 God class，业务逻辑散落在控制器和模型里。",
    "需要把依赖注入从\"到处 `new`\"收敛为构造函数注入。",
  ],
  constraints: [
    "控制器只做编排：验证 → 鉴权 → 调服务 → 映射响应。业务规则放到服务或领域对象。",
    "依赖通过构造函数注入，避免静态 Facade 与服务定位器。",
    "数据传输用 readonly DTO，不用裸数组跨层传递。",
    "业务概念（金额、邮箱）考虑封装为值对象。",
  ],
  checklist: [
    "控制器没有吞入业务逻辑。",
    "服务通过构造函数注入依赖，没有静态 Facade。",
    "数据传输用 readonly DTO，不用裸数组跨层传递。",
    "依赖方向单向：Controller → Service → Repository。",
  ],
  relatedSkills: [
    {
      get id() {
        return phpErrorHandlingSkill.id;
      },
      reason: "服务层和控制器边界需要异常层级、输入校验或错误映射时联动。",
    },
    {
      get id() {
        return phpTypeSafetySkill.id;
      },
      reason: "DTO、Repository 和集合类型需要 PHPStan / Psalm 标注时联动。",
    },
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "需要 readonly DTO、enum 或 match 支撑分层代码时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "控制器吞业务",
      pass: "薄控制器 + Service",
    }),
    defineAntiPattern({
      fail: "静态 Facade",
      pass: "构造注入",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "拆分 PHP 控制器、Service、Repository、DTO 和 Value Object 边界，减少静态 Facade、服务定位器和裸数组跨层传递。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先定位业务逻辑散落位置、依赖创建方式、跨层数据形态和测试替身边界。",
      "控制器只做验证、鉴权、调服务和响应映射；Service 编排业务流程；Repository 只做数据访问。",
      "依赖通过构造函数注入，DTO / Value Object 表达跨层数据和业务概念。",
      "分层职责表和薄控制器示例读取 `layered-architecture`；更完整模式读取 `patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Controller / Service / Repository / DTO / Value Object 职责边界。",
      "需要拆分的 God class、静态 Facade、裸数组和依赖方向问题。",
      "构造注入、测试替身、类型标注和迁移顺序建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "layered-architecture",
      source: new URL("./references/layered-architecture.md", import.meta.url),
      target: "references/layered-architecture.md",
      title: "PHP 分层架构速查",
      summary: "Controller、Service、Repository、DTO、Value Object 的职责边界和薄控制器示例。",
      loadWhen: "需要快速拆分 PHP 分层职责或审查控制器是否过厚时读取。",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "PHP 设计模式与分层架构的常见实现示例，包括 Service、Repository、DTO、值对象等。",
      loadWhen: "需要查阅 PHP 分层架构或设计模式的具体代码示例时读取。",
    }),
  ],
});
