import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const systemDiagnosticsSkill = defineSkill({
  id: "system-diagnostics",
  fullName: "Linux 系统诊断",
  description: "当用户说 Linux 主机变慢、服务异常、需要健康检查或要先摸清系统现状时使用。",
  useCases: [
    "用户要做健康检查、系统摸底、上线前巡检、故障前置采样或基础资源审计。",
    "若后续需要网络分析，可切到 [network-troubleshooter](../network-troubleshooter/SKILL.md)。",
  ],
  constraints: [
    "只运行只读命令；不安装软件、不修改配置、不重启服务。",
    "必须同时报告原始指标和解释性结论，不能只给“正常/异常”。",
    "某条命令失败时要记录失败原因并继续，不得中断整个诊断。",
    "采样时间、主机名、内核、发行版和负载必须出现在报告顶部。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "disk-cleanup",
      source: new URL("./references/disk-cleanup.md", import.meta.url),
      target: "references/disk-cleanup.md",
      title: "disk-cleanup.md",
      summary: "Reference material for system-diagnostics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "performance-optimizer",
      source: new URL("./references/performance-optimizer.md", import.meta.url),
      target: "references/performance-optimizer.md",
      title: "performance-optimizer.md",
      summary: "Reference material for system-diagnostics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
