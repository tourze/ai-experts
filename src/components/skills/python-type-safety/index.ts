import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { pythonDesignPatternsSkill } from "../python-design-patterns/index";
import { pythonErrorHandlingSkill } from "../python-error-handling/index";
import { pythonTestingPatternsSkill } from "../python-testing-patterns/index";

export const pythonTypeSafetySkill = defineSkill({
  id: "python-type-safety",
  fullName: "Python 类型安全",
  description: "当用户要为 Python 代码补类型注解、Protocol、TypedDict、泛型、TypeGuard 或配置 mypy/pyright 严格模式时使用。",
  useCases: [
    "给既有代码补类型，降低运行前才暴露的低级错误。",
    "设计库接口、仓储接口、DTO、事件对象和跨层边界类型。",
    "需要在继承、协议、联合类型和类型缩窄之间做选择。",
    "结构设计和边界拆分时，联动 `python-design-patterns`。",
    "失败类型和错误边界建模时，联动 `python-error-handling`。",
    "需要为类型守卫和泛型逻辑补测试时，联动 `python-testing-patterns`。",
  ],
  constraints: [
    "公共 API 先标注参数、返回值和重要属性，再逐步推进到内部实现。",
    "优先用 `Protocol`、`TypedDict`、`TypeGuard`、泛型表达真实边界，少用 `Any`。",
    "类型检查不能替代运行时校验；外部输入仍然需要验证。",
    "严格模式要渐进接入，但新增代码默认不接受裸 `Any`。",
    "类型注解应帮助读代码，不要为了“炫技”造难懂的类型体操。",
  ],
  checklist: [
    "所有公共函数和类是否具备明确签名。",
    "可空值、联合类型和边界输入是否被显式表达。",
    "`Any`、`cast()` 和 `type: ignore` 是否都有合理解释。",
    "类型检查规则是否进入 CI，而不是只在本地偶尔运行。",
    "运行时校验与静态类型是否保持一致，没有彼此打架。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonErrorHandlingSkill.id;
      },
      reason: "失败类型和错误边界建模时，联动 `python-error-handling`。",
    },
    {
      get id() {
        return pythonTestingPatternsSkill.id;
      },
      reason: "需要为类型守卫和泛型逻辑补测试时，联动 `python-testing-patterns`。",
    },
    {
      get id() {
        return pythonDesignPatternsSkill.id;
      },
      reason: "结构设计和边界拆分时，联动 `python-design-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Any 当默认值",
      pass: "用具体类型表达约束",
    }),
    defineAntiPattern({
      fail: "用继承代替 Protocol",
      pass: "用 Protocol 做结构化约束",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为 Python 公共 API、DTO、Protocol、TypedDict、TypeGuard、泛型和 mypy/pyright 严格模式设计类型边界。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先标注公共函数、类属性、跨层 DTO 和外部输入边界，再逐步收敛内部实现。",
      "优先用 Protocol、TypedDict、TypeGuard 和泛型表达真实约束，`Any` 只允许在边界适配层有解释。",
      "静态类型不能替代运行时校验，外部输入仍要验证后再进入核心逻辑。",
      "TypedDict、Protocol 和 TypeGuard 代码模式读取 `type-boundary-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "公共 API 签名、DTO / Protocol / TypedDict / TypeGuard 设计。",
      "`Any`、`cast()`、`type: ignore` 的收口或保留理由。",
      "类型检查 CI、运行时校验和需要补的类型守卫测试。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "type-boundary-patterns",
      source: new URL("./references/type-boundary-patterns.md", import.meta.url),
      target: "references/type-boundary-patterns.md",
      title: "Python 类型边界模式",
      summary: "TypedDict、Protocol、TypeGuard 和联合输入收窄示例。",
      loadWhen: "需要快速设计 Python 边界类型或类型守卫时读取。",
    }),
  ],
});
