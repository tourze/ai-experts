import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index.js";
import { archLinuxTriageSkill } from "../../skills/arch-linux-triage/index.js";
import { networkTroubleshooterSkill } from "../../skills/network-troubleshooter/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const systemDiagnosticianAgent = defineAgent({
  id: "system-diagnostician",
  description: "当需要对 Linux 主机做只读系统健康检查时使用。它检查 CPU、内存、磁盘、网络、服务和日志，定位瓶颈、误配置和故障信号。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: systemDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: archLinuxTriageSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: networkTroubleshooterSkill.id,
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
