import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { rustErrorHandlingSkill } from "../rust-error-handling/index";
import { rustOwnershipIdiomsSkill } from "../rust-ownership-idioms/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const rustTestingSkill = defineSkill({
  id: "rust-testing",
  fullName: "Rust 测试",
  description: "当用户要编写或重构 Rust 测试时使用；涉及测试命名、单元/集成/文档测试、断言模式、cargo-insta snapshot 或测试组织时触发。",
  useCases: [
    "编写新的单元测试、集成测试或文档测试。",
    "重构测试：改善命名、减少重复、消除脆弱断言。",
    "引入或使用 cargo-insta 做 snapshot 测试。",
    "组织 `tests/` 目录、test crate 或 benchmark。",
  ],
  constraints: [
    "测试名表达输入、条件与预期结果，如 `parse_port_rejects_zero`。",
    "`#[should_panic]` 只在确实测试 panic 路径时使用；错误路径用 `assert!(result.is_err())`。",
    "文档测试（`///` 中的代码块）同时充当活文档和回归保护。",
    "snapshot 测试（cargo-insta）适合输出结构复杂的场景；更新 snapshot 前必须人工审查 diff。",
    "集成测试放 `tests/` 目录，每个文件是独立编译 crate。",
  ],
  checklist: [
    "测试名是否准确表达输入、条件与预期结果？",
    "是否存在 `assert!(true)` 或 `assert_eq!(result, result)` 这类空断言？",
    "公共 API 是否有文档测试？",
  ],
  relatedSkills: [
    {
      get id() {
        return rustOwnershipIdiomsSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-error-handling`。",
    },
    {
      get id() {
        return rustErrorHandlingSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-error-handling`。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 Rust 特有语法与工具。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "测试名看不出行为：失败报 `test_it_works failed`，仍不知道测什么。",
      pass: "描述输入+条件+预期",
    }),
    defineAntiPattern({
      fail: "snapshot 自动 accept",
      pass: "人工审查",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为 Rust 代码编写和重构单元测试、集成测试、文档测试、snapshot 测试和测试目录组织。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认被测边界是内部逻辑、公共 API、文档示例还是复杂输出。",
      "按测试类型选择 `#[cfg(test)]`、`tests/*.rs`、rustdoc 代码块或 cargo-insta snapshot。",
      "测试名表达输入、条件和预期；错误路径用 Result 断言，不滥用 `#[should_panic]`。",
      "测试类型速查读取 `testing-matrix`，详细命名、snapshot 和组织模式读取 `chapter-05`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试类型选择、文件位置、命名方案和断言策略。",
      "snapshot 审查流程、文档测试缺口和集成测试组织建议。",
      "需要联动 `testing-patterns` 的通用 fixture / mock / 参数化问题。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "testing-matrix",
      source: new URL("./references/testing-matrix.md", import.meta.url),
      target: "references/testing-matrix.md",
      title: "Rust 测试类型速查",
      summary: "单元测试、集成测试、文档测试和 snapshot 测试的位置、编译方式与适用场景。",
      loadWhen: "需要快速选择 Rust 测试类型或组织测试目录时读取。",
    }),
    defineReference({
      id: "chapter-05",
      source: new URL("./references/chapter_05.md", import.meta.url),
      target: "references/chapter_05.md",
      title: "chapter_05.md",
      summary: "测试命名规范、文档测试、snapshot 测试（cargo-insta）与集成测试组织模式。",
      loadWhen: "需要编写 Rust 测试、引入 snapshot 测试或重构脆弱的测试断言时读取。",
    }),
  ],
});
