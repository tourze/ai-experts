import {
  AgentSandbox,
  defineAgent,
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
  bashBoundary: [
    "Bash 用于：`cargo build`、`cargo test`、`cargo clippy`、`cargo check`、`npm run build`、`pnpm build`、`tauri build`、git 操作。禁止：`tauri build` 发布模式不经确认、修改签名证书、连接外部发布服务。",
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
      id: tauriV2Skill.id,
      mode: SkillUseMode.Preload,
      reason: tauriV2Skill.description,
    },
    {
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: tauriIpcPatternsSkill.description,
    },
    {
      id: tauriReactIntegrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: tauriReactIntegrationSkill.description,
    },
    {
      id: tauriBuildPackagingSkill.id,
      mode: SkillUseMode.Preload,
      reason: tauriBuildPackagingSkill.description,
    },
    {
      id: tauriPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: tauriPluginDevelopmentSkill.description,
    }
  ],
});
