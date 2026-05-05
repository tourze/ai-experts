import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
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
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const rustReviewerAgent = defineAgent({
  id: "rust-reviewer",
  description: "当需要执行 Rust 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
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
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
