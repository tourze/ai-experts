import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { rustOwnershipIdiomsSkill } from "../../skills/rust-ownership-idioms/index.js";
import { rustErrorHandlingSkill } from "../../skills/rust-error-handling/index.js";
import { rustTypeDesignSkill } from "../../skills/rust-type-design/index.js";
import { rustAsyncPatternsSkill } from "../../skills/rust-async-patterns/index.js";
import { rustTestingSkill } from "../../skills/rust-testing/index.js";
import { testingPatternsSkill } from "../../skills/testing-patterns/index.js";
import { rustCargoWorkspaceSkill } from "../../skills/rust-cargo-workspace/index.js";
import { rustTokioRuntimeTuningSkill } from "../../skills/rust-tokio-runtime-tuning/index.js";
import { rustSerdePatternsSkill } from "../../skills/rust-serde-patterns/index.js";
import { rustProcMacroPatternsSkill } from "../../skills/rust-proc-macro-patterns/index.js";
import { rustDocumentationSkill } from "../../skills/rust-documentation/index.js";
import { rustPerformanceSkill } from "../../skills/rust-performance/index.js";
import { rustFfiBindingsSkill } from "../../skills/rust-ffi-bindings/index.js";

export const rustEngineerAgent = defineAgent({
  id: "rust-engineer",
  description: "当需要端到端设计或实现 Rust 项目时使用——覆盖所有权设计、错误处理、异步运行时、类型系统、FFI 集成、过程宏、序列化、性能优化、测试策略与 workspace 管理。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustOwnershipIdiomsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustTypeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustAsyncPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustCargoWorkspaceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustTokioRuntimeTuningSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustSerdePatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustProcMacroPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustDocumentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: rustFfiBindingsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
