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
  useCases: [
    "编写或审查测试时，需要确认结构、命名、隔离策略和 mock 边界是否正确。",
    "需要选择 fixture 策略、参数化方案或区分 mock/stub/fake 的适用场景。",
    "排查测试脆弱、过度 mock、顺序依赖或低信息量断言时做对照。",
    "各语言具体语法/工具见对应 skill：`go-testing-patterns`、`python-testing-patterns`、`rust-testing`、`java-junit`、`php-testing`、`javascript-typescript-jest`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
