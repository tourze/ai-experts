import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { tauriIpcPatternsSkill } from "../../skills/tauri-ipc-patterns/index";
import { tauriV2Skill } from "../../skills/tauri-v2/index";
import { tauriReactIntegrationSkill } from "../../skills/tauri-react-integration/index";
import { tauriBuildPackagingSkill } from "../../skills/tauri-build-packaging/index";
import { tauriPluginDevelopmentSkill } from "../../skills/tauri-plugin-development/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const tauriReviewerAgent = defineAgent({
  id: "tauri-reviewer",
  description: "当需要只读审查 Tauri IPC、权限范围、插件架构、构建配置和前后端边界 时使用。",
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
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: tauriV2Skill.id,
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
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
