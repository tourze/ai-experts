import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const testDrivenDevelopmentSkill = defineSkill({
  id: "test-driven-development",
  fullName: "测试驱动开发",
  description: "当用户要按 TDD 流程编码、先写测试再写实现、或要求红绿重构时使用。",
  useCases: [
    "新功能实现。",
    "bug 修复与回归保护。",
    "行为重构或接口改造。",
    "需要把 [testing-strategy](../testing-strategy/SKILL.md) 的缺陷后扩面高优先级场景落成真实测试。",
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
