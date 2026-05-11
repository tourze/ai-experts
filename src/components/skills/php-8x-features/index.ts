import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { phpDesignPatternsSkill } from "../php-design-patterns/index";
import { phpErrorHandlingSkill } from "../php-error-handling/index";
import { phpTypeSafetySkill } from "../php-type-safety/index";

export const phpXFeaturesSkill = defineSkill({
  id: "php-8x-features",
  fullName: "PHP 8.x 现代语言特性",
  description: "当需要在 PHP 8.1-8.3+ 项目中使用 `readonly class`、backed enum、`match`、命名参数、构造器提升、交叉类型、DNF 类型、`#[\\Override]` 等现代语法特性时使用。",
  useCases: [
    "新建 PHP 类、函数或模块，需要选择合适的 PHP 8.x 语言特性。",
    "把遗留 PHP 5/7 代码升级到 PHP 8.1-8.3+ 的现代写法。",
    "在 readonly class、枚举、match、交叉类型之间做取舍。",
    "需要快速查阅某个 PHP 8.x 特性的正确用法。",
  ],
  constraints: [
    "所有生产代码默认启用 `declare(strict_types=1)`。",
    "方法参数、返回值、属性都要有明确类型；无法收窄时优先定义 DTO 或值对象，不要退回 `mixed`。",
    "优先使用 `readonly` 属性和 `readonly class` 来表达不可变数据。",
    "枚举替代 class 常量组和魔法字符串；有底层值时用 backed enum。",
    "`match` 替代多分支 `switch`；利用其穷尽性检查和严格比较。",
    "构造器提升（constructor promotion）简化属性声明，减少样板代码。",
    "命名参数只在调用点提升可读性时使用，不要滥用到每个函数调用。",
  ],
  checklist: [
    "`declare(strict_types=1)` 出现在每个 PHP 文件顶部。",
    "所有参数、返回值和属性都有显式类型声明。",
    "常量组已迁移为枚举，魔法字符串已消除。",
    "多分支 `switch` 已替换为 `match`。",
    "不可变数据使用了 `readonly class` 或 `readonly` 属性。",
  ],
  relatedSkills: [
    {
      get skill() {
        return phpErrorHandlingSkill;
      },
      reason: "需要设计异常层级或输入校验时，联动查看 `php-error-handling`。",
    },
    {
      get skill() {
        return phpTypeSafetySkill;
      },
      reason: "需要配置 PHPStan/Psalm 或补泛型标注时，联动查看 `php-type-safety`。",
    },
    {
      get skill() {
        return phpDesignPatternsSkill;
      },
      reason: "需要设计服务层、DTO、Repository 时，联动查看 `php-design-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "class 常量组代替枚举",
      pass: "backed enum",
    }),
    defineAntiPattern({
      fail: "switch + 默认 break",
      pass: "match 强制穷尽",
    }),
    defineAntiPattern({
      fail: "DTO 不加 readonly",
      pass: "readonly class",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认项目最低 PHP 版本、strict_types 状态、静态分析级别和框架约束。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "DTO / 值对象优先考虑 readonly class，魔法字符串和常量组优先考虑 backed enum。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "多分支条件优先用 `match` 表达严格比较和穷尽性；高级类型和 attributes 只在提升边界清晰度时使用。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "readonly、enum、match 和版本速查读取 `language-feature-patterns`；交叉类型、DNF 类型和 attributes 读取 `advanced-types-and-attributes`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "可使用的 PHP 8.x 特性、最低版本要求和迁移收益。",
      "readonly / enum / match / 类型系统改造建议和代码风险。",
      "需要补的静态分析、测试和兼容性验证。",
    ],
  }),
  references: [
    defineReference({
      id: "language-feature-patterns",
      source: new URL("./references/language-feature-patterns.md", import.meta.url),
      target: "references/language-feature-patterns.md",
      title: "PHP 8.x 语言特性模式",
      summary: "readonly class、backed enum、match 和 PHP 8.x 特性版本速查。",
      loadWhen: "需要快速选择或迁移 PHP 8.x 现代语言特性时读取。",
    }),
    defineReference({
      id: "advanced-types-and-attributes",
      source: new URL("./references/advanced-types-and-attributes.md", import.meta.url),
      target: "references/advanced-types-and-attributes.md",
      title: "advanced-types-and-attributes.md",
      summary: "PHP 8.x 高级类型系统与属性的详细说明，包括交叉类型、DNF 类型和内置属性。",
      loadWhen: "需要了解交叉类型、DNF 类型或 `#[Override]` 等高级类型和属性特性时读取。",
    }),
  ],
});
