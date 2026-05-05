import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { incidentResponseSkill } from "../../skills/incident-response/index.js";
import { logAnalyzerSkill } from "../../skills/log-analyzer/index.js";
import { monitoringObservabilitySkill } from "../../skills/monitoring-observability/index.js";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index.js";
import { networkTroubleshooterSkill } from "../../skills/network-troubleshooter/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const incidentResponderAgent = defineAgent({
  id: "incident-responder",
  description: "当线上服务异常、性能下降、报错或中断需要做事故应急响应、按时间线还原、定位根因并提出止血与修复方案时使用。它只读分析日志、监控与配置，不修改运行时。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: incidentResponseSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: logAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: monitoringObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: systemDiagnosticsSkill.id,
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
