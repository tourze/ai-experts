import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for python-testing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
