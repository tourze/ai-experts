import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { networkTroubleshooterSkill } from "../network-troubleshooter/index";

export const systemDiagnosticsSkill = defineSkill({
  id: "system-diagnostics",
  fullName: "Linux 系统诊断",
  description: "当用户说 Linux 主机变慢、服务异常、需要健康检查或要先摸清系统现状时使用。",
  useCases: [
    "用户要做健康检查、系统摸底、上线前巡检、故障前置采样或基础资源审计。",
    "若后续需要网络分析，可切到 `network-troubleshooter`。",
  ],
  constraints: [
    "只运行只读命令；不安装软件、不修改配置、不重启服务。",
    "必须同时报告原始指标和解释性结论，不能只给“正常/异常”。",
    "某条命令失败时要记录失败原因并继续，不得中断整个诊断。",
    "采样时间、主机名、内核、发行版和负载必须出现在报告顶部。",
  ],
  checklist: [
    "主机名、时间、内核、发行版、启动时长齐全。",
    "CPU/负载、内存、磁盘、网络接口、失败服务都被采样。",
    "列出 Top 进程并标明资源热点。",
    "若日志异常，保留最近错误而不是只写“服务异常”。",
    "诊断报告要明确下一步应切换到哪个专用技能。诊断后如需磁盘清理参见 [references/disk-cleanup.md](references/disk-cleanup.md)，如需性能优化参见 [references/performance-optimizer.md](references/performance-optimizer.md)。",
    "如果执行命令失败，报告里记录命令和 stderr 摘要。",
  ],
  relatedSkills: [
    {
      get id() {
        return networkTroubleshooterSkill.id;
      },
      reason: "若后续需要网络分析，可切到 `network-troubleshooter`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "诊断时偷偷改系统",
      pass: "只读采样",
    }),
    defineAntiPattern({
      fail: "只有命令清单无结论",
      pass: "采样 + 结论 + 下一步",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先记录主机名、采样时间、发行版、内核、启动时长和负载，命令失败时记录错误并继续。",
      "采样 CPU/负载、内存、磁盘、网络接口、失败服务、Top CPU/内存进程、socket 摘要和最近错误日志。",
      "报告同时给出原始指标和解释性结论，不偷偷安装软件、改配置或重启服务。",
      "磁盘不足读取 disk-cleanup reference；性能瓶颈读取 performance-optimizer；网络问题转 network-troubleshooter。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "主机基础信息、资源采样、失败服务、Top 进程、网络接口和日志异常。",
      "每项指标的正常/异常解释、命令失败记录和 stderr 摘要。",
      "下一步专用技能、参考资料或只读复查命令。",
    ],
  }),
  references: [
    defineReference({
      id: "disk-cleanup",
      source: new URL("./references/disk-cleanup.md", import.meta.url),
      target: "references/disk-cleanup.md",
      title: "disk-cleanup.md",
      summary: "Linux 系统磁盘空间分析工具和清理方法指南。",
      loadWhen: "诊断发现磁盘空间不足，需要清理策略或工具指引时读取。",
    }),
    defineReference({
      id: "performance-optimizer",
      source: new URL("./references/performance-optimizer.md", import.meta.url),
      target: "references/performance-optimizer.md",
      title: "performance-optimizer.md",
      summary: "Linux 系统性能优化指南，包含 CPU、内存、磁盘 I/O 和内核参数调优。",
      loadWhen: "诊断发现性能瓶颈，需要系统性的优化方案时读取。",
    }),
  ],
});
