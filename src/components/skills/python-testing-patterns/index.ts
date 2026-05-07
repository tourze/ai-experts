import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { asyncPythonPatternsSkill } from "../async-python-patterns/index";
import { pythonErrorHandlingSkill } from "../python-error-handling/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const pythonTestingPatternsSkill = defineSkill({
  id: "python-testing-patterns",
  fullName: "Python 测试模式",
  description: "当用户要用 pytest 编写单元测试、集成测试、fixture、mock、参数化测试或异步测试时使用。",
  useCases: [
    "为 Python 模块补单元测试、集成测试和回归测试。",
    "需要设计 fixture、mock、参数化测试和失败路径覆盖。",
    "需要把异步代码、数据库、文件系统或外部 API 测试做干净隔离。",
    "更完整的 async、monkeypatch、临时目录和 property-based 示例见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "失败路径设计和断言策略时，联动 `python-error-handling`。",
    "异步测试组织方式时，联动 `async-python-patterns`。",
  ],
  constraints: [
    "单元测试优先测边界和业务规则，不要把 pytest 框架细节当成主要断言对象。",
  ],
  checklist: [
    "测试数据是否最小化且易读，不靠魔法常量撑着。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonErrorHandlingSkill.id;
      },
      reason: "失败路径设计和断言策略时，联动 `python-error-handling`。",
    },
    {
      get id() {
        return asyncPythonPatternsSkill.id;
      },
      reason: "异步测试组织方式时，联动 `async-python-patterns`。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 Python 特有语法与工具。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全 mock 测到 mock 自己",
      pass: "隔离外部，真实业务",
    }),
    defineAntiPattern({
      fail: "低信息量断言",
      pass: "具体断言",
    }),
    defineAntiPattern({
      fail: "只测 happy path",
      pass: "覆盖边界 + 错误",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认被测边界、外部依赖、失败路径、是否异步和测试数据最小集合。",
      "单元测试聚焦业务规则和边界条件，外部依赖用 fixture / mock / monkeypatch 隔离。",
      "参数化测试命名输入和预期，集成测试与单元测试分层运行。",
      "pytest fixture 和参数化代码模式读取 `pytest-patterns`；异步、monkeypatch、临时目录和 property-based 读取 `advanced-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试层级、fixture、mock、参数化 case 和断言策略。",
      "失败路径、边界条件、异步测试和外部依赖隔离建议。",
      "脆弱测试、低信息断言和回归缺口。",
    ],
  }),
  references: [
    defineReference({
      id: "pytest-patterns",
      source: new URL("./references/pytest-patterns.md", import.meta.url),
      target: "references/pytest-patterns.md",
      title: "pytest 基础模式",
      summary: "dataclass 被测对象、fixture 和 parametrize 的 pytest 示例。",
      loadWhen: "需要快速编写 Python pytest fixture 或参数化测试时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Python 测试高级模式，包括异步测试、monkeypatch、临时目录和 property-based 测试示例。",
      loadWhen: "需要查阅 Python 异步测试、monkeypatch 或 property-based 测试等高级模式时读取。",
    }),
  ],
});
