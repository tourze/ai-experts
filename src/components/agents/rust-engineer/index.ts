import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  role: `你是资深 Rust 工程师。你可以读取项目源码、Cargo 配置与依赖，设计方案并在用户指定目录下编写或修改 Rust 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Rust 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[模块结构 / trait 设计 / 所有权边界 / 错误策略 / 测试覆盖]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[trait 契约 / 类型状态 / 异步模型 / FFI 边界 / 错误传播]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[cargo check / cargo clippy / cargo test / cargo bench 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[unsafe 未审查的路径 / 未验证的平台]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`cargo build`、`cargo test`、`cargo clippy`、`cargo bench`、`cargo doc`、`cargo fmt --check`、`cargo tree`、git 操作。禁止：修改生产配置、连接外部服务、`cargo publish`、未经确认的依赖升级。",
  ],
  qualityStandards: [
    "trait 设计优先：面向 trait 编程，不暴露内部实现细节。",
    "每个 unsafe 块有 SAFETY 注释说明不变量。",
    "错误类型有明确的 Display 和 Error impl，不吞错误。",
    "公共 API 必须有 rustdoc，Safety/Panics/Errors 段落完整。",
    "性能改动必须有 before/after criterion benchmark，不凭感觉。",
    "async 代码中不调用阻塞函数，spawn 的 task 有明确生命周期终点。",
  ],
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
