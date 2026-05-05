import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const testingPatternsSkill = defineSkill({
  id: "testing-patterns",
  fullName: "通用测试模式",
  description: "当需要设计测试策略、编写高质量测试、选择 mock/fixture/参数化方案或遵循 AAA/FIRST 原则时使用。语言特定语法/工具细节由对应语言测试 skill 覆盖。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
