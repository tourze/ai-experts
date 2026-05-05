import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustCargoWorkspaceSkill = defineSkill({
  id: "rust-cargo-workspace",
  fullName: "Rust Cargo Workspace",
  description: "当用户需要管理 Cargo workspace 时使用；涉及 [workspace]、workspace.dependencies、feature flag 或 crate 拆分时触发。",
  useCases: [
    "新建/重构 Rust monorepo，规划成员和共享依赖。",
    "设计 feature flag 跨 crate 传播策略。",
    "编写 `build.rs` 或规划 CI 缓存。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-cargo-workspace.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
