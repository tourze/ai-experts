import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pythonTypeSafetySkill = defineSkill({
  id: "python-type-safety",
  fullName: "Python 类型安全",
  description: "当用户要为 Python 代码补类型注解、Protocol、TypedDict、泛型、TypeGuard 或配置 mypy/pyright 严格模式时使用。",
  useCases: [
    "给既有代码补类型，降低运行前才暴露的低级错误。",
    "设计库接口、仓储接口、DTO、事件对象和跨层边界类型。",
    "需要在继承、协议、联合类型和类型缩窄之间做选择。",
    "结构设计和边界拆分时，联动 [python-design-patterns](../python-design-patterns/SKILL.md)。",
    "失败类型和错误边界建模时，联动 [python-error-handling](../python-error-handling/SKILL.md)。",
    "需要为类型守卫和泛型逻辑补测试时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
