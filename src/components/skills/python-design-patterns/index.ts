import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  checklist: [
    "一个类是否只有一个主要变化原因。",
    "I/O 能否被替身替换，从而让业务逻辑单测独立运行。",
    "抽象层是否真正减少了重复。",
    "模块之间是否只暴露最小接口。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "继承叠基类复用几行",
      pass: "组合注入",
    }),
    defineAntiPattern({
      fail: "构造函数参数爆炸",
      pass: "按领域拆分",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先找主要变化原因、I/O 边界、领域对象和当前耦合点。",
      "用 Protocol 或 ABC 描述消费方需要的最小接口，构造函数注入具体实现。",
      "组合优先于继承；DTO 用 dataclass / NamedTuple 表达稳定数据。",
      "Service + Repository + Protocol 代码模式读取 `service-boundary-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "组件职责、接口边界、依赖注入方式和 DTO 形态。",
      "需要拆分的 God object、继承链或构造参数膨胀问题。",
      "测试替身、模块暴露面和剩余抽象成本。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "service-boundary-patterns",
      source: new URL("./references/service-boundary-patterns.md", import.meta.url),
      target: "references/service-boundary-patterns.md",
      title: "Python 服务边界模式",
      summary: "dataclass DTO、Protocol repository 和 service 构造注入示例。",
      loadWhen: "需要快速拆分 Python service/repository/adapter 边界时读取。",
    }),
  ],
});
