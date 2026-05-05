import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { webmanNamingConventionsSkill } from "../../skills/webman-naming-conventions/index";
import { webmanCustomProcessesSkill } from "../../skills/webman-custom-processes/index";
import { webmanWebsocketPatternsSkill } from "../../skills/webman-websocket-patterns/index";
import { webmanPluginDevelopmentSkill } from "../../skills/webman-plugin-development/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const webmanReviewerAgent = defineAgent({
  id: "webman-reviewer",
  description: "当需要只读审查 Webman 命名规范、自定义进程、WebSocket、插件机制以及 worker 长生命周期风险时使用。",
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
      id: webmanNamingConventionsSkill.id,
      mode: SkillUseMode.Preload,
      reason: webmanNamingConventionsSkill.description,
    },
    {
      id: webmanCustomProcessesSkill.id,
      mode: SkillUseMode.Preload,
      reason: webmanCustomProcessesSkill.description,
    },
    {
      id: webmanWebsocketPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: webmanWebsocketPatternsSkill.description,
    },
    {
      id: webmanPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: webmanPluginDevelopmentSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
