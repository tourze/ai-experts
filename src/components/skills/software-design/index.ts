import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goDesignPatternsSkill } from "../go-design-patterns/index";
import { phpDesignPatternsSkill } from "../php-design-patterns/index";
import { pythonDesignPatternsSkill } from "../python-design-patterns/index";
import { refactoringPatternsSkill } from "../refactoring-patterns/index";

export const softwareDesignSkill = defineSkill({
  id: "software-design",
  fullName: "软件设计",
  description: "当需要拆分职责、设计服务层、减少耦合、在组合与继承之间做选择，或从复杂度、深模块、信息隐藏角度评价设计时使用。语言无关的通用设计原则与架构模式。",
  useCases: [
    "新建 service、repository、adapter 等核心组件时需要先定边界。",
    "现有类变成 God object，职责缠绕、难测、难改。",
    "需要在继承、组合、接口、工具函数之间做取舍。",
    "需要规划依赖注入策略和分层方向。",
    "需要从复杂度、深模块、信息隐藏角度评价现有设计。",
    "各语言落地：`go-design-patterns`、`python-design-patterns`、`php-design-patterns`。",
    "需要把设计判断转成具体命名化重构手法。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "一个类是否只有一个变化原因。",
    "I/O 能否被替身替换，让业务逻辑单测独立。",
    "抽象是否真正减少了重复，而非增加跳转。",
    "模块间只暴露最小接口，依赖无循环。",
    "构造函数参数 ≤5，超过通常需拆分。",
    "是否识别了变更放大、认知负担、未知未知数。",
    "模块是深还是浅，知识有无泄漏。",
    "注释记录的是设计意图和不变量，还是翻译代码。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "浅模块：多层只转发不封装复杂度的类链。",
      pass: "把复杂度封装进模块边界，删除只转发的层。",
    }),
    defineAntiPattern({
      fail: "继承滥用：为共享几行工具方法而继承。",
      pass: "优先组合或委托，只在真实 is-a 层次上使用继承。",
    }),
    defineAntiPattern({
      fail: "Fat Controller：控制器内直接写业务逻辑、发通知、记审计。",
      pass: "控制器只编排请求响应，业务规则放到 service/use case。",
    }),
    defineAntiPattern({
      fail: "静态定位器：静态 Facade/Service Locator 导致无法测试。",
      pass: "用显式依赖注入，让测试能替换边界依赖。",
    }),
    defineAntiPattern({
      fail: "配置地狱：18 个参数让调用方承担本应隐藏的复杂度。",
      pass: "把参数收口成意图明确的配置对象或更高层 API。",
    }),
  ],
  relatedSkills: [
    {
      get skill() {
        return refactoringPatternsSkill;
      },
      reason: "设计判断已经明确，需要选择 Extract Method、Move Method、Extract Class 等具体重构动作时联动。",
    },
    {
      get skill() {
        return goDesignPatternsSkill;
      },
      reason: "Go 代码需要把通用职责边界落成 interface、package、context、repository 或 service 结构时联动。",
    },
    {
      get skill() {
        return pythonDesignPatternsSkill;
      },
      reason: "Python 代码需要把通用设计判断落成 dataclass、protocol、service、repository 或依赖注入结构时联动。",
    },
    {
      get skill() {
        return phpDesignPatternsSkill;
      },
      reason: "PHP 代码需要把通用设计判断落成 DTO、service、repository、异常层级或框架边界时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断问题是职责边界、抽象层次、I/O 隔离、依赖方向还是复杂度泄漏。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "以是否降低整体复杂度为最高标准，不为局部优雅引入浅模块或跳转成本。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "检查模块是否隐藏变化知识、接口是否最小、依赖是否单向、业务逻辑是否脱离框架边界。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "设计原则和分层速查读取 `design-principles`；深模块、信息隐藏和复杂度症状读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "职责边界、抽象选择、模块深浅和信息隐藏判断。",
      "分层、依赖注入、I/O 隔离和接口最小化建议。",
      "设计反模式、复杂度来源和需要转成具体重构动作的下一步。",
    ],
  }),
  references: [
    defineReference({
      id: "design-principles",
      source: new URL("./references/design-principles.md", import.meta.url),
      target: "references/design-principles.md",
      title: "软件设计原则与分层速查",
      summary: "深模块、信息隐藏、战略式编程、组合优先、分层职责和依赖方向速查。",
      loadWhen: "需要评价或设计语言无关的软件结构、职责边界和分层方案时读取。",
    }),
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "软件设计中常见反模式的详细分析和纠正方案。",
      loadWhen: "需要识别和修正既有设计中的反模式或学习常见设计错误时读取。",
    }),
    defineReference({
      id: "comments-as-design",
      source: new URL("./references/comments-as-design.md", import.meta.url),
      target: "references/comments-as-design.md",
      title: "comments-as-design.md",
      summary: "注释作为设计文档的最佳实践，包含设计意图和不变量的记录方法。",
      loadWhen: "需要评估注释质量或建立注释作为设计文档的规范时读取。",
    }),
    defineReference({
      id: "complexity-symptoms",
      source: new URL("./references/complexity-symptoms.md", import.meta.url),
      target: "references/complexity-symptoms.md",
      title: "complexity-symptoms.md",
      summary: "软件复杂度症状的识别指南，包含变更放大、认知负担和未知未知数的判断标准。",
      loadWhen: "需要诊断现有代码库的复杂度问题或评估模块的可维护性时读取。",
    }),
    defineReference({
      id: "deep-modules",
      source: new URL("./references/deep-modules.md", import.meta.url),
      target: "references/deep-modules.md",
      title: "deep-modules.md",
      summary: "深模块设计原则，包含如何封装复杂度、减少浅模块和优化模块接口。",
      loadWhen: "需要评价模块是深还是浅，或重构浅模块以降低系统复杂度时读取。",
    }),
    defineReference({
      id: "general-vs-special",
      source: new URL("./references/general-vs-special.md", import.meta.url),
      target: "references/general-vs-special.md",
      title: "general-vs-special.md",
      summary: "通用性与特化设计的权衡分析，包含何时选择通用接口和何时特化。",
      loadWhen: "需要判断抽象层次是否合适或在通用与特化之间做选择时读取。",
    }),
    defineReference({
      id: "information-hiding",
      source: new URL("./references/information-hiding.md", import.meta.url),
      target: "references/information-hiding.md",
      title: "information-hiding.md",
      summary: "信息隐藏原则的详细阐述，包含最小接口暴露和模块边界封装技巧。",
      loadWhen: "需要设计或重构模块边界以隐藏实现细节和降低耦合时读取。",
    }),
    defineReference({
      id: "strategic-programming",
      source: new URL("./references/strategic-programming.md", import.meta.url),
      target: "references/strategic-programming.md",
      title: "strategic-programming.md",
      summary: "战略性编程 vs 战术性编程的对比和实践指导。",
      loadWhen: "需要判断当前投入是战术修复还是战略性投资，或规划长期代码投资方向时读取。",
    }),
  ],
});
