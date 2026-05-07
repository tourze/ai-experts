import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const testDrivenDevelopmentSkill = defineSkill({
  id: "test-driven-development",
  fullName: "测试驱动开发",
  description: "当用户要按 TDD 流程编码、先写测试再写实现、或要求红绿重构时使用。",
  useCases: [
    "新功能实现。",
    "bug 修复与回归保护。",
    "行为重构或接口改造。",
    "需要把 `testing-strategy` 的缺陷后扩面高优先级场景落成真实测试。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "没有失败测试，不写生产代码。",
    "每轮只测一个行为；测试名中出现两个 `and` 往往就该拆分。",
    "必须亲眼看到测试失败，且失败原因正确。",
    "绿灯阶段只写“刚好通过”的实现，不顺手加功能。",
    "如果已经先写了代码，不能把它当“参考”继续补测试；要么删掉重来，要么明确承认不是 TDD。",
    "写 mock 或测试工具前先看 [references/testing-anti-patterns.md](references/testing-anti-patterns.md)。",
  ],
  checklist: [
    "每个行为先有失败测试",
    "已确认失败原因是“功能缺失”，不是拼写或环境错误",
    "实现只覆盖当前测试需要的最小能力",
    "当前测试与相关回归测试都通过",
    "没在绿灯阶段偷偷加需求",
    "若用了 mock，确认没在测试 mock 自己",
  ],
  relatedSkills: [
    {
      get id() {
        return testingStrategySkill.id;
      },
      reason: "需要先确定风险驱动测试范围、质量门或缺陷后扩面优先级时联动。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "需要确认 AAA / FIRST、fixture、mock/stub/fake 或测试命名基线时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "先写完再补测试：这不是 TDD，这是”给已有代码补覆盖率”。测试没有驱动设计。",
      pass: "先写失败测试，再写刚好通过的实现。",
    }),
    defineAntiPattern({
      fail: "失败测试一上来就通过，却继续往下写。",
      pass: "停下来确认测试是否验证了已有行为、写错断言或场景不成立。",
    }),
    defineAntiPattern({
      fail: "用庞大 mock 代替真实行为断言。",
      pass: "只 mock 不可控边界，先读 `testing-anti-patterns` 判断是否暴露设计问题。",
    }),
    defineAntiPattern({
      fail: "绿灯阶段顺手把未来需求也做了。",
      pass: "只实现当前失败测试需要的最小行为，未来需求回到 RED。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先写一个当前行为的失败测试，并亲眼确认失败原因是功能缺失而不是环境或断言错误。",
      "绿灯阶段只写刚好通过该测试的生产代码，不顺手实现未来需求。",
      "测试通过后再重构命名、重复和结构，重构不改变行为并持续跑相关测试。",
      "RED/GREEN/REFACTOR 示例读取 `red-green-refactor-patterns`；纪律和 mock 风险读取 discipline / testing anti-pattern references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前行为、失败测试、失败原因和最小实现范围。",
      "每轮红绿重构状态、测试命令和通过证据。",
      "重构动作、mock 风险和不是 TDD 的偏离说明。",
    ],
  }),
  references: [
    defineReference({
      id: "red-green-refactor-patterns",
      source: new URL("./references/red-green-refactor-patterns.md", import.meta.url),
      target: "references/red-green-refactor-patterns.md",
      title: "TDD 红绿重构代码模式",
      summary: "RED / GREEN / REFACTOR 的代码示例、循环图入口和纪律守卫摘要。",
      loadWhen: "需要按 TDD 编写或审查一个红绿重构循环时读取。",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "TDD 纪律守卫规则，防止在红绿重构循环中偷步、跳步或绕过原则。",
      loadWhen: "需要严格检查 TDD 流程是否合规，或出现纪律松动迹象时读取。",
    }),
    defineReference({
      id: "testing-anti-patterns",
      source: new URL("./references/testing-anti-patterns.md", import.meta.url),
      target: "references/testing-anti-patterns.md",
      title: "testing-anti-patterns.md",
      summary: "TDD 中 mock 滥用、测试后补、断言失焦等测试反模式与纠偏方式。",
      loadWhen: "写 mock、测试工具或 TDD 纪律开始松动时读取。",
    }),
    defineReference({
      id: "tdd-cycle",
      source: new URL("./references/tdd-cycle.dot", import.meta.url),
      target: "references/tdd-cycle.dot",
      title: "tdd-cycle.dot",
      summary: "TDD 红绿重构循环的图形化流程图（Graphviz DOT 格式）。",
      loadWhen: "需要可视化展示 TDD 循环步骤或嵌入文档时读取。",
    }),
  ],
});
