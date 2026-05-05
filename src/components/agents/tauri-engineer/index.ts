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
