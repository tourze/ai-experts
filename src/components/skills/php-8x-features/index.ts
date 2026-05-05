import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  relatedSkills: [
    {
      get id() {
        return phpErrorHandlingSkill.id;
      },
      reason: "需要设计异常层级或输入校验时，联动查看 `php-error-handling`。",
    },
    {
      get id() {
        return phpTypeSafetySkill.id;
      },
      reason: "需要配置 PHPStan/Psalm 或补泛型标注时，联动查看 `php-type-safety`。",
    },
    {
      get id() {
        return phpDesignPatternsSkill.id;
      },
      reason: "需要设计服务层、DTO、Repository 时，联动查看 `php-design-patterns`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-types-and-attributes",
      source: new URL("./references/advanced-types-and-attributes.md", import.meta.url),
      target: "references/advanced-types-and-attributes.md",
      title: "advanced-types-and-attributes.md",
      summary: "Reference material for php-8x-features.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
