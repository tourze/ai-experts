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
      reason: "测试代码需要 PHP 8 attributes、readonly DTO、enum 或 match 语法时联动。",
    },
    {
      get id() {
        return phpErrorHandlingSkill.id;
      },
      reason: "需要覆盖异常层级、输入校验、外部依赖失败或用户错误映射时联动。",
    },
    {
      get id() {
        return phpTypeSafetySkill.id;
      },
      reason: "测试夹具、data provider 和 mock 需要精确 PHPDoc / 静态分析类型时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "确认被测行为、测试层级、依赖边界和现有测试风格；需要具体写法时读取 `examples` reference。",
      "选择 PHPUnit 或 Pest 结构，优先使用 `#[Test]`、`#[DataProvider]`、`#[CoversClass]` 等 PHP 8 属性。",
      "设计 Arrange-Act-Assert、fixture、数据提供者和外部边界 mock，避免 mock 被测对象内部。",
      "为集成测试明确状态清理、事务边界、环境依赖和 HTTP/CLI 冒烟路径。",
      "审查 `phpunit.xml` 的严格模式、测试套件、覆盖率和分组策略。",
      "输出新增/重构测试、覆盖边界和仍需补测的风险。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试用例或测试重构建议。",
      "fixture、DataProvider、Mock 和集成边界说明。",
      "`phpunit.xml` 或 Pest 配置检查项。",
      "未覆盖风险和下一步补测计划。",
    ],
  }),
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
