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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计和维护 Rust Cargo workspace 的成员划分、共享依赖、feature 传播、build.rs 和 CI 检查策略。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 crate 成员、发布边界、共享依赖、feature 关系和 CI 目标。",
      "统一 `[workspace.dependencies]`、`resolver = \"2\"`、path / version 依赖和 additive feature 策略。",
      "检查 `build.rs` 是否只写 `OUT_DIR`，跨 crate 集成测试是否放在专用 test crate。",
      "按需读取 `patterns` 中的 workspace Cargo.toml、feature flag、build.rs 和 CI 缓存模式。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "workspace 成员划分、共享依赖和 feature 传播方案。",
      "Cargo.toml / build.rs / CI 检查建议与风险点。",
      "需要读取或引用的 `patterns` 章节和剩余决策。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Cargo workspace 依赖共享、feature additive、build.rs 约束与 CI 缓存的详细配置模式。",
      loadWhen: "需要设计 workspace 结构、配置共享依赖或规划 CI 构建策略时读取。",
    }),
  ],
});
