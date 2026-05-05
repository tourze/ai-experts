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
  role: `你是资深 Tauri 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: tauriIpcPatternsSkill.description,
    },
    {
      id: tauriV2Skill.id,
      mode: SkillUseMode.Preload,
      reason: tauriV2Skill.description,
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
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
