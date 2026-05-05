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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
