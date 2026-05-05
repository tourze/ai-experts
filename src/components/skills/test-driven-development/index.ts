import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";

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
    "写 mock 或测试工具前先看 [testing-anti-patterns.md](./testing-anti-patterns.md)。",
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
      reason: "需要把 `testing-strategy` 的缺陷后扩面高优先级场景落成真实测试。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "先写完再补测试：这不是 TDD，这是”给已有代码补覆盖率”。测试没有驱动设计。",
      pass: "先写失败测试再实现：失败测试一上来就通过，却继续往下写。 用庞大 mock 代替真实行为断言。 绿灯阶段顺手把未来需求也做了。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for test-driven-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tdd-cycle",
      source: new URL("./references/tdd-cycle.dot", import.meta.url),
      target: "references/tdd-cycle.dot",
      title: "tdd-cycle.dot",
      summary: "Reference material for test-driven-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
