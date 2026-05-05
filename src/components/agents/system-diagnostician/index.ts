import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { systemDiagnosticsSkill } from "../../skills/system-diagnostics/index";
import { archLinuxTriageSkill } from "../../skills/arch-linux-triage/index";
import { networkTroubleshooterSkill } from "../../skills/network-troubleshooter/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const systemDiagnosticianAgent = defineAgent({
  id: "system-diagnostician",
  description: "当需要对 Linux 主机做只读系统健康检查时使用。它检查 CPU、内存、磁盘、网络、服务和日志，定位瓶颈、误配置和故障信号。",
  role: `你是资深 Linux 系统工程师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  tools: [KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: systemDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: systemDiagnosticsSkill.description,
    },
    {
      id: archLinuxTriageSkill.id,
      mode: SkillUseMode.Preload,
      reason: archLinuxTriageSkill.description,
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
