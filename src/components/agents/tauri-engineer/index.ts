import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { tauriV2Skill } from "../../skills/tauri-v2/index";
import { tauriIpcPatternsSkill } from "../../skills/tauri-ipc-patterns/index";
import { tauriReactIntegrationSkill } from "../../skills/tauri-react-integration/index";
import { tauriBuildPackagingSkill } from "../../skills/tauri-build-packaging/index";
import { tauriPluginDevelopmentSkill } from "../../skills/tauri-plugin-development/index";

export const tauriEngineerAgent = defineAgent({
  id: "tauri-engineer",
  description: "当需要端到端设计或实现 Tauri v2 桌面应用时使用——覆盖项目搭建、IPC 命令设计、权限模型、React 前端集成、插件开发、构建打包与代码签名。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Tauri 工程师。你可以读取项目源码、tauri.conf.json 与 Cargo 配置，设计方案并在用户指定目录下编写或修改 Rust 后端、前端集成代码、测试与设计文档；不修改签名证书、密钥或发布配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / IPC 接口设计 / 前端集成 / 插件开发 / 构建打包 / 安全加固；明确 Tauri 版本、前端框架和目标平台。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有项目结构、capabilities 声明、IPC command 定义和构建配置，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：涉及 IPC 边界、权限范围、多窗口架构的改动先出设计，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写 Rust 后端 → 写前端 invoke 封装 → 补测试 → cargo check → cargo clippy → 前端构建验证。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 构建验证 + IPC 契约文档。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Tauri 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[项目结构 / IPC 设计 / 权限模型 / 前端集成 / 构建配置]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[IPC 契约 / 权限范围 / 多窗口架构 / 前后端数据流]",
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
        body: "[cargo check / cargo clippy / cargo test / tauri build 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未测试的 IPC 路径 / 未验证的平台]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`cargo build`、`cargo test`、`cargo clippy`、`cargo check`、`npm run build`、`pnpm build`、`tauri build`、git 操作。禁止：`tauri build` 发布模式不经确认、修改签名证书、连接外部发布服务。",
  ],
  qualityStandards: [
    "IPC command 有明确的参数类型和错误类型，不使用 String 通配错误。",
    "权限声明最小化：每个 capability 只声明实际需要的 command 和 scope。",
    "前端 invoke 调用有超时和错误处理，不静默吞 IPC 错误。",
    "事件监听在组件卸载时清理，避免内存泄漏和重复订阅。",
    "构建产物经过代码签名验证（macOS）或 installer 测试（Windows/Linux）。",
    "每个 command 至少有一个集成测试，关键安全路径有权限边界测试。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供代码工程通用工作流与安全边界。",
    },
    {
      id: tauriV2Skill.id,
      mode: SkillUseMode.Preload,
      reason: "掌握 Tauri v2 项目结构与权限模型。",
    },
    {
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计安全的 IPC 命令与错误类型。",
    },
    {
      id: tauriReactIntegrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "实现 React 前端与 Tauri 后端的数据流集成。",
    },
    {
      id: tauriBuildPackagingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "配置构建打包、签名与自动更新。",
    },
    {
      id: tauriPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "开发与集成自定义 Tauri 插件。",
    }
  ],
});
