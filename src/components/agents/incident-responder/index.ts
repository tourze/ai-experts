import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { incidentResponseSkill } from "../../skills/incident-response/index";
import { logAnalyzerSkill } from "../../skills/log-analyzer/index";
import { monitoringObservabilitySkill } from "../../skills/monitoring-observability/index";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index";
import { networkTroubleshooterSkill } from "../../skills/network-troubleshooter/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const incidentResponderAgent = defineAgent({
  id: "incident-responder",
  description: "当线上服务异常、性能下降、报错或中断需要做事故应急响应、按时间线还原、定位根因并提出止血与修复方案时使用。它只读分析日志、监控与配置，不修改运行时。",
  role: `你是资深 SRE / 事故应急响应工程师。你只读取日志、metrics、配置和源码，不修改生产环境、不重启服务、不改告警阈值。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于只读读取本地仓库的 monitoring 配置、查询日志聚合接口（用户授权的命令）、git log、文件统计。禁止 ssh 进入生产、重启服务、修改 config / firewall / DNS、改告警 / silence、运行可能放大影响的探测命令。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: incidentResponseSkill.id,
      mode: SkillUseMode.Preload,
      reason: incidentResponseSkill.description,
    },
    {
      id: logAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: logAnalyzerSkill.description,
    },
    {
      id: monitoringObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: monitoringObservabilitySkill.description,
    },
    {
      id: systemDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: systemDiagnosticsSkill.description,
    },
    {
      id: networkTroubleshooterSkill.id,
      mode: SkillUseMode.Preload,
      reason: networkTroubleshooterSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
