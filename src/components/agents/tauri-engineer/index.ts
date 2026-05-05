import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { tauriV2Skill } from "../../skills/tauri-v2/index.js";
import { tauriIpcPatternsSkill } from "../../skills/tauri-ipc-patterns/index.js";
import { tauriReactIntegrationSkill } from "../../skills/tauri-react-integration/index.js";
import { tauriBuildPackagingSkill } from "../../skills/tauri-build-packaging/index.js";
import { tauriPluginDevelopmentSkill } from "../../skills/tauri-plugin-development/index.js";

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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriV2Skill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriReactIntegrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriBuildPackagingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
