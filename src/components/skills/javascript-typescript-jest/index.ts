import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const javascriptTypescriptJestSkill = defineSkill({
  id: "javascript-typescript-jest",
  fullName: "Jest 测试模式",
  description: "当需要用 Jest 为 JavaScript 或 TypeScript 编写单元测试、mock 或异步测试时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for javascript-typescript-jest.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
