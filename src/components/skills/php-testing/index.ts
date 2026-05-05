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
import { testingPatternsSkill } from "../testing-patterns/index";

export const phpTestingSkill = defineSkill({
  id: "php-testing",
  fullName: "PHP 测试",
  description: "当用户编写、审查或重构 PHP 测试、PHPUnit/Pest 用例或测试配置时使用。Laravel 项目改用 `laravel-tdd`。",
  useCases: [
    "编写新的 PHPUnit / Pest 测试类、测试方法和测试夹具。",
    "审查或重构已有测试，降低脆弱断言、过度 Mock 和复制粘贴。",
    "统一 `#[Test]`、数据提供者、覆盖率边界与测试分组。",
    "调整 `phpunit.xml` 的严格模式、套件划分和覆盖率策略。",
  ],
  constraints: [
    "测试文件启用 `declare(strict_types=1)`，保持显式类型。",
    "优先用 PHP 8 属性（`#[Test]`、`#[DataProvider]`、`#[CoversClass]`），不用旧式注解。",
    "集成测试要明确边界、清理状态、避免环境耦合。",
  ],
  checklist: [
    "编码标准：[strict_types](rules/standard-strict-types.md) · [final 类](rules/standard-final-classes.md) · [类型提示](rules/standard-visibility-type-hints.md)",
    "属性与数据集：[#[Test]](rules/attr-test-attribute.md) · [#[CoversClass]](rules/attr-covers-class.md) · [DataProvider](rules/data-provider.md)",
    "Mock 与集成：[避免过度 Mock](rules/mock-avoid-over-mocking.md) · [HTTP 冒烟](rules/integration-smoke-http.md) · [事务清理](rules/integration-transactions.md)",
  ],
  relatedSkills: [
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "联动：`php-8x-features` · `php-error-handling` · `php-type-safety`。",
    },
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
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 PHP 特有语法与工具。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "一测多行为",
      pass: "一测一行为",
    }),
    defineAntiPattern({
      fail: "Mock 被测对象内部",
      pass: "只 mock 外部边界",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "PHP 测试用例编写示例，包括 PHPUnit/Pest 的 fixture、mock、参数化测试等模式。",
      loadWhen: "需要查阅 PHP 测试的具体编写示例或模式时读取。",
    }),
  ],
});
