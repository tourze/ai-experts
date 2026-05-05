import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { rustOwnershipIdiomsSkill } from "../../skills/rust-ownership-idioms/index";
import { rustErrorHandlingSkill } from "../../skills/rust-error-handling/index";
import { rustTypeDesignSkill } from "../../skills/rust-type-design/index";
import { rustAsyncPatternsSkill } from "../../skills/rust-async-patterns/index";
import { rustTestingSkill } from "../../skills/rust-testing/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { rustCargoWorkspaceSkill } from "../../skills/rust-cargo-workspace/index";
import { rustTokioRuntimeTuningSkill } from "../../skills/rust-tokio-runtime-tuning/index";
import { rustSerdePatternsSkill } from "../../skills/rust-serde-patterns/index";
import { rustProcMacroPatternsSkill } from "../../skills/rust-proc-macro-patterns/index";
import { rustDocumentationSkill } from "../../skills/rust-documentation/index";
import { rustPerformanceSkill } from "../../skills/rust-performance/index";
import { rustFfiBindingsSkill } from "../../skills/rust-ffi-bindings/index";

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
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: rustOwnershipIdiomsSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustOwnershipIdiomsSkill.description,
    },
    {
      id: rustErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustErrorHandlingSkill.description,
    },
    {
      id: rustTypeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustTypeDesignSkill.description,
    },
    {
      id: rustAsyncPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustAsyncPatternsSkill.description,
    },
    {
      id: rustTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustTestingSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: rustCargoWorkspaceSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustCargoWorkspaceSkill.description,
    },
    {
      id: rustTokioRuntimeTuningSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustTokioRuntimeTuningSkill.description,
    },
    {
      id: rustSerdePatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustSerdePatternsSkill.description,
    },
    {
      id: rustProcMacroPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustProcMacroPatternsSkill.description,
    },
    {
      id: rustDocumentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustDocumentationSkill.description,
    },
    {
      id: rustPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustPerformanceSkill.description,
    },
    {
      id: rustFfiBindingsSkill.id,
      mode: SkillUseMode.Preload,
      reason: rustFfiBindingsSkill.description,
    }
  ],
});
