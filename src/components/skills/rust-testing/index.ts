import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-05",
      source: new URL("./references/chapter_05.md", import.meta.url),
      target: "references/chapter_05.md",
      title: "chapter_05.md",
      summary: "Reference material for rust-testing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
