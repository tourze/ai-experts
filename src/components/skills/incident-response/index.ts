import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { logAnalyzerSkill } from "../log-analyzer/index";
import { monitoringObservabilitySkill } from "../monitoring-observability/index";
import { networkTroubleshooterSkill } from "../network-troubleshooter/index";
import { systemDiagnosticsSkill } from "../system-diagnostics/index";

export const incidentResponseSkill = defineSkill({
  id: "incident-response",
  fullName: "事故响应",
  description: "当用户反馈服务异常、性能下降、报错、中断、告警升级或需要事故响应协助时使用。",
  useCases: [
    "线上服务异常、性能下降、报错或中断。",
    "需要从症状快速分类为服务、性能、网络、认证或数据问题。",
    "事故复盘前还原完整时间线和决策链。",
  ],
  constraints: [
    "先只读排查，再提出修复；未经确认不重启或改配置。",
    "每次只验证一个假设，记录证据与反证。",
    "时间线优先：先建时间线再下结论；禁止跳过时间线直接猜根因。",
    "止血先于根因修复：先执行可逆止血，根因修复进 follow-up。",
    "区分根因与触发因素：「让事故可能的脆弱性」≠「这次触发的具体动作」。",
    "时间线按 UTC 排序；本地时间显式标注时区。",
    "报告中不暴露生产 secret/token；引用日志时脱敏。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "止血和根因修复混在一起，在止血窗口内提出多个不相关的重构建议。",
      pass: "分级修复路线：先执行可逆止血，再按短期/中期/长期分别规划修复。",
    }),
  ],
  checklist: [
    "事故摘要是否包含起止时间、影响面、严重度、用户可见症状？",
    "时间线是否按 UTC 严格排序，每项标注来源和证据？",
    "根因是否区分了脆弱性（系统级）和触发因素（事件级）？",
    "止血方案是否可逆，是否标注了回滚条件？",
    "修复路线是否按短期/中期/长期分级？",
    "观测补齐是否标注了优先级和负责方？",
    "报告中是否有脱敏处理（无真实 secret/token/IP）？",
  ],
  relatedSkills: [
    {
      get id() {
        return monitoringObservabilitySkill.id;
      },
      reason: "需要补齐 metrics、logs、traces、告警和 SLO 监控设计时联动。",
    },
    {
      get id() {
        return systemDiagnosticsSkill.id;
      },
      reason: "需要检查 Linux 主机、进程、磁盘、CPU、内存或服务状态时联动。",
    },
    {
      get id() {
        return networkTroubleshooterSkill.id;
      },
      reason: "症状指向 DNS、TLS、端口、路由、丢包或外部依赖网络问题时联动。",
    },
    {
      get id() {
        return logAnalyzerSkill.id;
      },
      reason: "需要对齐多源日志、错误上下文和时间窗口以支撑时间线时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "Triage 先确认影响面、起始时间、严重度、用户可见症状、上下游依赖和收入/业务影响。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "只读采集服务状态、错误日志、磁盘、端口、进程和最近部署/配置/feature flag 变化。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "生成 2-3 个候选假设，逐个验证和反证；每次只验证一个假设。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "按 P0/P1/P2/P3 分级：核心全阻、核心严重降级、部分异常、非核心异常。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "构建 UTC 时间线，对齐 log、metric、deploy、config change、计划任务和外部事件。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "止血方案只选可逆动作：切流、回滚、限流、降级；写明回滚条件和生效时间。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "根因分析区分触发动作和系统脆弱性，修复路线按短期、本月、季度拆分。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "事故响应报告：事故摘要、诊断过程、时间线、根因分析、止血方案、修复路线、观测缺口、范围限制。",
      "根因记录：症状、触发条件、候选假设、证据、反证、根因和修复建议。",
      "分级与行动：P0/P1/P2/P3、响应要求、可逆止血、回滚条件和 owner。",
    ],
  }),
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "事故响应中的常见反模式：错误归因、跳过时间线、止血滞后等典型案例。",
      loadWhen: "需要审查事故响应流程或避免经验性错误时读取。",
    }),
    defineReference({
      id: "time-line-template",
      source: new URL("./references/time-line-template.md", import.meta.url),
      target: "references/time-line-template.md",
      title: "time-line-template.md",
      summary: "事故时间线模板：按 UTC 排序的事件记录格式与复盘信息组织方式。",
      loadWhen: "需要建立事故时间线或撰写事故复盘报告时读取。",
    }),
  ],
});
