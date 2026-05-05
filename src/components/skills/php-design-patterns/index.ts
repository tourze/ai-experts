import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
      reason: "联动：`php-8x-features` · `php-error-handling` · `php-type-safety`。",
    },
    {
      get id() {
        return phpTypeSafetySkill.id;
      },
      reason: "联动：`php-8x-features` · `php-error-handling` · `php-type-safety`。",
    },
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "联动：`php-8x-features` · `php-error-handling` · `php-type-safety`",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-design-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
