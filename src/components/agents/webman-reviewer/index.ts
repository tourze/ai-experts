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
  role: `你是资深 Webman / Workerman 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
