import {
  AgentSandbox,
  defineAgent,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
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
  description: "当需要执行 Rust 专项代码审查时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 Rust 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: rustOwnershipIdiomsSkill.id,
        label: "门禁 1",
        checks: "所有权/借用基础：不必要的 clone、错误的引用生命周期、Box/Rc/Arc 选型",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: rustErrorHandlingSkill.id,
        label: "门禁 2",
        checks: "错误类型选型：thiserror vs anyhow、unwrap 滥用、? 传播",
      }),
      defineWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "route-rust-ffi-bindings",
        triggers: ["unsafe", "extern \"C\"", "#[no_mangle]"],
        skill: rustFfiBindingsSkill.id,
        checks: "unsafe 块 SAFETY 注释、FFI 边界内存安全、ABI 兼容性",
        output: "不安全代码审计",
      }),
      defineWorkflowRoute({
        id: "route-rust-async-patterns",
        triggers: ["tokio::", "async fn", ".await", "JoinSet"],
        skill: rustAsyncPatternsSkill.id,
        checks: "Send+'static 约束、阻塞代码混入、锁跨 await、CancellationToken",
        output: "异步安全结论",
      }),
      defineWorkflowRoute({
        id: "route-rust-serde-patterns",
        triggers: ["#[derive(Serialize", "Deserialize", "#[serde"],
        skill: rustSerdePatternsSkill.id,
        checks: "serde 属性正确性、枚举表示、默认值、rename 约定",
        output: "序列化审查",
      }),
      defineWorkflowRoute({
        id: "route-rust-type-design",
        triggers: ["dyn Trait", "impl Trait", "where"],
        skill: rustTypeDesignSkill.id,
        checks: "静态 vs 动态分发、类型状态模式、trait object 安全性",
        output: "类型设计建议",
      }),
      defineWorkflowRoute({
        id: "route-rust-testing",
        triggers: ["#[test]", "#[cfg(test)]", "cargo test"],
        skill: rustTestingSkill.id,
        checks: "测试命名、单元/集成/文档测试覆盖、mock 策略",
        output: "测试质量审计",
      }),
      defineWorkflowRoute({
        id: "route-rust-cargo-workspace",
        triggers: ["Cargo.toml", "[workspace]"],
        skill: rustCargoWorkspaceSkill.id,
        checks: "workspace 结构、feature 组织、依赖版本、feature 门控",
        output: "工程结构审查",
      }),
      defineWorkflowRoute({
        id: "route-rust-performance",
        triggers: ["#[bench]"],
        skill: rustPerformanceSkill.id,
        checks: "benchmark 证据链、flamegraph、分配热点、优化前后对比",
        output: "性能证据验证",
      }),
      defineWorkflowRoute({
        id: "route-rust-documentation",
        triggers: ["///", "//!", "#[doc]"],
        skill: rustDocumentationSkill.id,
        checks: "文档覆盖、Safety/Panics/Errors 段落、示例可编译",
        output: "文档质量审计",
      }),
      defineWorkflowRoute({
        id: "route-rust-proc-macro-patterns",
        triggers: ["syn", "quote"],
        skill: rustProcMacroPatternsSkill.id,
        checks: "错误 spans、 hygiene、编译时间",
        output: "宏审查",
      }),
      defineWorkflowRoute({
        id: "route-rust-tokio-runtime-tuning",
        triggers: ["tokio runtime 配置"],
        skill: rustTokioRuntimeTuningSkill.id,
        checks: "worker 线程数、blocking 线程池、enable 特性",
        output: "Runtime 调优建议",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：ownership → error-handling → 确认基线",
      }),
      defineWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配本 workflow 的 route 节点，逐项深入",
      }),
      defineWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineWorkflowStep({
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
      reason: "提供只读审查方法论，作为审查过程骨架。",
    },
    {
      id: rustOwnershipIdiomsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "门禁检查所有权与借用合规性。",
    },
    {
      id: rustErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "门禁检查错误处理选型与 unwrap 滥用。",
    },
    {
      id: rustTypeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查静态分发与 trait object 选型是否合理。",
    },
    {
      id: rustAsyncPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查异步代码中锁跨 await 和阻塞混入问题。",
    },
    {
      id: rustTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查测试命名、分层与 mock 策略。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "补充通用测试质量审查视角。",
    },
    {
      id: rustCargoWorkspaceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 workspace 结构与 feature 组织。",
    },
    {
      id: rustTokioRuntimeTuningSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 tokio runtime 配置是否合理。",
    },
    {
      id: rustSerdePatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 serde 属性正确性与枚举表示。",
    },
    {
      id: rustProcMacroPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查过程宏错误 span 与编译时间影响。",
    },
    {
      id: rustDocumentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 rustdoc 覆盖与 Safety 段落完整性。",
    },
    {
      id: rustPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "验证性能优化的 benchmark 证据链。",
    },
    {
      id: rustFfiBindingsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 unsafe 块 SAFETY 注释与 FFI 边界安全。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "标注每条审查结论的事实/推断/假设属性。",
    }
  ],
});
