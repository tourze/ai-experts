import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  constraints: [
    "共享依赖放 `[workspace.dependencies]`；成员用 `dep.workspace = true`。",
    "edition 2021+ 必须 `resolver = \"2\"`。",
    "feature 必须 additive：启用只增功能不减。",
    "未发布成员 path 依赖；已发布 crate 版本号依赖。",
    "`build.rs` 只写 `OUT_DIR`，禁写 `src/`。",
    "跨 crate 集成测试放专用 test crate。",
    "CI 用 `--workspace` 全局检查。",
  ],
  checklist: [
    "`resolver = \"2\"` 已设？共享依赖全在 workspace 级？",
    "feature 全 additive？`build.rs` 只写 `OUT_DIR`？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "各成员各写版本",
      pass: "workspace.dependencies",
    }),
    defineAntiPattern({
      fail: "feature 做减法",
      pass: "feature additive",
    }),
    defineAntiPattern({
      fail: "build.rs 写 src/",
      pass: "只写 OUT_DIR",
    }),
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
