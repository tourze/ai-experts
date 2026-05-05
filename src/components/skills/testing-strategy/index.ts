import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const testingStrategySkill = defineSkill({
  id: "testing-strategy",
  description: "当需要为模块、接口或功能设计测试计划，或制定风险驱动测试策略、质量门、coverage target 与 QA 资源分配时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "test-brainstorm",
      source: new URL("./references/test-brainstorm.md", import.meta.url),
      target: "references/test-brainstorm.md",
      title: "test-brainstorm.md",
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testing-discipline",
      source: new URL("./references/testing-discipline.md", import.meta.url),
      target: "references/testing-discipline.md",
      title: "testing-discipline.md",
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "verification-loop",
      source: new URL("./references/verification-loop.md", import.meta.url),
      target: "references/verification-loop.md",
      title: "verification-loop.md",
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for testing-strategy.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
