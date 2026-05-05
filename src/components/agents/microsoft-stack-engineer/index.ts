import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { microsoftDocsSkill } from "../../skills/microsoft-docs/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const microsoftStackEngineerAgent = defineAgent({
  id: "microsoft-stack-engineer",
  description: "当需要只读审查 .NET / Azure / Microsoft SDK 代码，校验 API 签名、官方文档 alignment、配额限制、retry / 异步模式或最佳实践时使用。它不修改业务代码、不调用任何需要凭据的 Azure 资源。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: microsoftDocsSkill.id,
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
