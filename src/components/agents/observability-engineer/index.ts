import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { monitoringObservabilitySkill } from "../../skills/monitoring-observability/index.js";
import { pythonObservabilitySkill } from "../../skills/python-observability/index.js";
import { goObservabilitySkill } from "../../skills/go-observability/index.js";
import { logAnalyzerSkill } from "../../skills/log-analyzer/index.js";
import { incidentResponseSkill } from "../../skills/incident-response/index.js";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index.js";

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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: monitoringObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: logAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: incidentResponseSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: systemDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
