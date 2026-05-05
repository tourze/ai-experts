import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { monitoringObservabilitySkill } from "../../skills/monitoring-observability/index";
import { pythonObservabilitySkill } from "../../skills/python-observability/index";
import { goObservabilitySkill } from "../../skills/go-observability/index";
import { logAnalyzerSkill } from "../../skills/log-analyzer/index";
import { incidentResponseSkill } from "../../skills/incident-response/index";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index";

export const observabilityEngineerAgent = defineAgent({
  id: "observability-engineer",
  description: "当需要端到端设计或建设服务可观测性——覆盖指标/日志/告警/健康检查设计、Python/Go 语言落地、日志分析与事故分级时使用。它可以读取源码与配置，在用户指定目录下产出观测方案与落地脚本，但不修改生产配置。",
  role: `你是资深可观测性工程师。你可以读取源码、配置与既有监控数据，在用户指定目录（默认 \`docs/observability/\`）下创建或更新观测方案、指标清单、告警规则草稿与落地脚本；不修改生产配置、不改告警阈值、不操作真实凭据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于读取本地仓库的观测配置、metrics 定义、日志格式模板和告警规则文件；运行用户授权的格式校验与语法检查。禁止连接生产监控系统、修改告警规则/阈值、重启 exporter 或调整采样率。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: monitoringObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: monitoringObservabilitySkill.description,
    },
    {
      id: pythonObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonObservabilitySkill.description,
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: goObservabilitySkill.description,
    },
    {
      id: logAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: logAnalyzerSkill.description,
    },
    {
      id: incidentResponseSkill.id,
      mode: SkillUseMode.Preload,
      reason: incidentResponseSkill.description,
    },
    {
      id: systemDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: systemDiagnosticsSkill.description,
    }
  ],
});
