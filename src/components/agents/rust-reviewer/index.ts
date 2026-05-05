import {
  AgentSandbox,
  defineAgent,
  defineAgentWorkflow,
  defineAgentWorkflowGate,
  defineAgentWorkflowRoute,
  defineAgentWorkflowStep,
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
  role: `你是资深 Rust 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: rustOwnershipIdiomsSkill.id,
        label: "门禁 1",
        checks: "所有权/借用基础：不必要的 clone、错误的引用生命周期、Box/Rc/Arc 选型",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: rustErrorHandlingSkill.id,
        label: "门禁 2",
        checks: "错误类型选型：thiserror vs anyhow、unwrap 滥用、? 传播",
      }),
      defineAgentWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineAgentWorkflowRoute({
        id: "route-rust-ffi-bindings",
        triggers: ["unsafe", "extern \"C\"", "#[no_mangle]"],
        skill: rustFfiBindingsSkill.id,
        checks: "unsafe 块 SAFETY 注释、FFI 边界内存安全、ABI 兼容性",
        output: "不安全代码审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-async-patterns",
        triggers: ["tokio::", "async fn", ".await", "JoinSet"],
        skill: rustAsyncPatternsSkill.id,
        checks: "Send+'static 约束、阻塞代码混入、锁跨 await、CancellationToken",
        output: "异步安全结论",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-serde-patterns",
        triggers: ["#[derive(Serialize", "Deserialize", "#[serde"],
        skill: rustSerdePatternsSkill.id,
        checks: "serde 属性正确性、枚举表示、默认值、rename 约定",
        output: "序列化审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-type-design",
        triggers: ["dyn Trait", "impl Trait", "where"],
        skill: rustTypeDesignSkill.id,
        checks: "静态 vs 动态分发、类型状态模式、trait object 安全性",
        output: "类型设计建议",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-testing",
        triggers: ["#[test]", "#[cfg(test)]", "cargo test"],
        skill: rustTestingSkill.id,
        checks: "测试命名、单元/集成/文档测试覆盖、mock 策略",
        output: "测试质量审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-cargo-workspace",
        triggers: ["Cargo.toml", "[workspace]"],
        skill: rustCargoWorkspaceSkill.id,
        checks: "workspace 结构、feature 组织、依赖版本、feature 门控",
        output: "工程结构审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-performance",
        triggers: ["#[bench]"],
        skill: rustPerformanceSkill.id,
        checks: "benchmark 证据链、flamegraph、分配热点、优化前后对比",
        output: "性能证据验证",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-documentation",
        triggers: ["///", "//!", "#[doc]"],
        skill: rustDocumentationSkill.id,
        checks: "文档覆盖、Safety/Panics/Errors 段落、示例可编译",
        output: "文档质量审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-proc-macro-patterns",
        triggers: ["syn", "quote"],
        skill: rustProcMacroPatternsSkill.id,
        checks: "错误 spans、 hygiene、编译时间",
        output: "宏审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-rust-tokio-runtime-tuning",
        triggers: ["tokio runtime 配置"],
        skill: rustTokioRuntimeTuningSkill.id,
        checks: "worker 线程数、blocking 线程池、enable 特性",
        output: "Runtime 调优建议",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：ownership → error-handling → 确认基线",
      }),
      defineAgentWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配场景路由表，逐项深入",
      }),
      defineAgentWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineAgentWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineAgentWorkflowStep({
        id: "final-5",
        label: "排序：安全（unsafe/FFI） > 正确性 > 影响面 > 执行成本",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
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
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
