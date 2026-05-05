import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pythonDesignPatternsSkill = defineSkill({
  id: "python-design-patterns",
  fullName: "Python 设计模式",
  description: "当用户要拆分职责、设计服务层、减少耦合、在组合与继承之间做选择，或重构 Python 组件结构时使用。",
  useCases: [
    "新建 service、repository、adapter 等核心组件时需要先定边界。",
    "现有类已经变成 God object，职责缠绕、难测、难改。",
    "需要在继承、组合、协议、工具函数之间做取舍。",
  ],
  constraints: [
    "依赖注入用 `Protocol` 或 ABC 定义接口，构造函数注入实现。",
    "组合优先于继承；共享几行代码用 mixin 或注入而非继承叠基类。",
    "用 `@dataclass(slots=True)` 或 `NamedTuple` 做不可变 DTO。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
