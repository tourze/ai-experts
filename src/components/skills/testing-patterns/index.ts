import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goTestingPatternsSkill } from "../go-testing-patterns/index";
import { javaJunitSkill } from "../java-junit/index";
import { javascriptTypescriptJestSkill } from "../javascript-typescript-jest/index";
import { phpTestingSkill } from "../php-testing/index";
import { pythonTestingPatternsSkill } from "../python-testing-patterns/index";
import { rustTestingSkill } from "../rust-testing/index";

export const testingPatternsSkill = defineSkill({
  id: "testing-patterns",
  fullName: "通用测试模式",
  description: "当需要处理语言无关的测试设计、fixture、test double、参数化或脆弱测试排查时使用；具体语言语法转对应测试 skill。",
  useCases: [
    "编写或审查测试时，需要确认结构、命名、隔离策略和 mock 边界是否正确。",
    "需要选择 fixture 策略、参数化方案或区分 mock/stub/fake 的适用场景。",
    "排查测试脆弱、过度 mock、顺序依赖或低信息量断言时做对照。",
    "各语言具体语法/工具见对应 skill：`go-testing-patterns`、`python-testing-patterns`、`rust-testing`、`java-junit`、`php-testing`、`javascript-typescript-jest`。",
  ],
  constraints: [
    "测试要验证公共 API 的可观察行为，不绑定私有字段、内部缓存或实现细节。",
    "Fixture 默认每测试独立创建，共享可变状态必须有明确隔离和清理策略。",
    "Mock 只用于不可控外部边界；业务逻辑优先用真实实现、stub 或 fake。",
    "测试名必须能在失败时暴露行为、场景和预期结果。",
  ],
  checklist: [
    "测试结构是否能清楚区分 Arrange / Act / Assert。",
    "每个测试是否只验证一个行为。",
    "测试是否满足 Fast / Independent / Repeatable / Self-Validating / Timely。",
    "Fixture 是否独立、清理明确且不包含业务逻辑。",
    "Mock / Stub / Fake 的选择是否匹配边界和断言目标。",
    "参数化测试是否覆盖典型值、边界值、空/零输入、异常值和等价类代表。",
  ],
  relatedSkills: [
    {
      get id() {
        return goTestingPatternsSkill.id;
      },
      reason: "Go 测试需要 table-driven tests、subtest、benchmark、race 或 `testing` 包约定时联动。",
    },
    {
      get id() {
        return pythonTestingPatternsSkill.id;
      },
      reason: "Python 测试需要 pytest fixture、parametrize、monkeypatch 或 async 测试约定时联动。",
    },
    {
      get id() {
        return rustTestingSkill.id;
      },
      reason: "Rust 测试需要 `#[test]`、property testing、fixture、panic 断言或 cargo test 约定时联动。",
    },
    {
      get id() {
        return javaJunitSkill.id;
      },
      reason: "Java 测试需要 JUnit、Mockito、Spring 测试切片或 JVM 测试组织方式时联动。",
    },
    {
      get id() {
        return phpTestingSkill.id;
      },
      reason: "PHP 测试需要 PHPUnit / Pest、属性、data provider、mock 或 `phpunit.xml` 细节时联动。",
    },
    {
      get id() {
        return javascriptTypescriptJestSkill.id;
      },
      reason: "JavaScript / TypeScript 测试需要 Jest / Vitest、mock、fake timers 或异步断言细节时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "测试依赖执行顺序或共享状态，单独运行、随机顺序运行就失败。",
      pass: "每个测试独立 setup，清理全局状态和外部资源。",
    }),
    defineAntiPattern({
      fail: "全 mock：测试主要验证 mock 配置，重构内部实现就大面积失败。",
      pass: "只 mock 不可控外部边界，业务行为用真实实现、stub 或 fake 验证。",
    }),
    defineAntiPattern({
      fail: "低信息量断言：`assert(result)` 或只看日志，需要人工判断对不对。",
      pass: "断言具体字段、数量、错误码或可观察输出。",
    }),
    defineAntiPattern({
      fail: "直接测试私有方法、内部缓存或临时状态。",
      pass: "通过公共 API 的可观察行为覆盖内部逻辑。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认测试目标是行为合同、边界条件、失败路径还是回归保护，不从内部实现反推测试。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按 AAA 和 FIRST 检查结构、速度、独立性、可重复性和自验证能力。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "选择 fixture 与 test double 策略，优先隔离外部边界而不是 mock 内部业务逻辑。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "通用示例、命名约定和反模式读取 `testing-patterns-guide`；语言语法细节转向对应语言测试 skill。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试结构、测试命名、行为覆盖和参数化建议。",
      "Fixture、mock/stub/fake、状态清理和异步同步策略。",
      "测试反模式、脆弱性来源和需要转向的语言特定测试 skill。",
    ],
  }),
  references: [
    defineReference({
      id: "testing-patterns-guide",
      source: new URL("./references/testing-patterns-guide.md", import.meta.url),
      target: "references/testing-patterns-guide.md",
      title: "通用测试模式指南",
      summary: "AAA、FIRST、行为合同、fixture、mock/stub/fake、参数化、命名约定和测试反模式。",
      loadWhen: "需要设计或审查语言无关测试结构、fixture、mock 或命名约定时读取。",
    }),
  ],
});
