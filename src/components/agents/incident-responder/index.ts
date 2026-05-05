import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "事故响应报告：<incident>",
    sections: [
      defineAgentOutputSection({
        title: "事故摘要",
        body: "[起止时间 / 影响面 / 严重度 / 用户可见症状]",
      }),
      defineAgentOutputSection({
        title: "时间线",
        body: "[UTC 时间 → 事件 → 来源（log / metric / deploy / 外部）]",
      }),
      defineAgentOutputSection({
        title: "根因分析",
        body: "[触发动作 / 脆弱性 / 数据流路径 / 证据链]",
      }),
      defineAgentOutputSection({
        title: "止血动作",
        body: "[已采取 / 建议立即采取，含回滚预案]",
      }),
      defineAgentOutputSection({
        title: "修复路线",
        body: "[短期 / 中期 / 长期，按风险与成本排序]",
      }),
      defineAgentOutputSection({
        title: "待补观测",
        body: "[需要新增的 metric / log / trace / 告警]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未触达的子系统 / 时间窗 / 数据类型]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于只读读取本地仓库的 monitoring 配置、查询日志聚合接口（用户授权的命令）、git log、文件统计。禁止 ssh 进入生产、重启服务、修改 config / firewall / DNS、改告警 / silence、运行可能放大影响的探测命令。",
  ],
  qualityStandards: [
    "时间线按 UTC 严格排序；本地时间须显式标注时区。",
    "止血方案必须可逆，并标注回滚条件。",
    "根因不能停留在「服务挂了」「DB 慢」级别；必须指向具体代码、配置或资源。",
    "不在报告中暴露生产 secret 或 token；引用日志时脱敏。",
    "不修改任何生产配置；改动建议交回 oncall 主导执行。",
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
