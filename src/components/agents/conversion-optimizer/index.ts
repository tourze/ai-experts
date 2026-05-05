import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { croMethodologySkill } from "../../skills/cro-methodology/index";
import { redesignMyLandingpageSkill } from "../../skills/redesign-my-landingpage/index";
import { funnelArchitectSkill } from "../../skills/funnel-architect/index";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const conversionOptimizerAgent = defineAgent({
  id: "conversion-optimizer",
  description: "当需要诊断或优化网站、落地页、注册流程、订阅流程、弹窗或 onboarding 的转化率，定位漏斗瓶颈并设计 CTA / 表单 / 弹窗实验时使用。",
  role: `你是资深转化率优化顾问。你只做只读分析、产出实验假设与改造方案，不直接修改业务代码或埋点配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认业务目标、关键转化事件、当前漏斗指标基线、流量结构与可改造范围。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "自上而下定位漏斗瓶颈：访问 → 注册 → 激活 → 购买 / 留存；用 funnel-architect 与 analytics-tracking 校准事件定义和数据可信度。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "对瓶颈页面 / 流程做 CRO 拆解：信息架构、价值主张、CTA、信任元素、表单、错误处理、移动端适配。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "给出实验队列：每个实验明确假设、指标、最小样本量、上线门槛与回滚策略，按 ICE/PIE 排序。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "转化优化分析：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状摘要",
        body: "[关键转化事件、基线指标、流量结构、已知约束]",
      }),
      defineAgentOutputSection({
        title: "漏斗诊断",
        body: "[各阶段转化率、瓶颈定位、数据可信度评估]",
      }),
      defineAgentOutputSection({
        title: "体验问题清单",
        body: "[页面 / 流程 → 问题 → 证据 → 严重度]",
      }),
      defineAgentOutputSection({
        title: "实验队列",
        body: "[假设 → 改动 → 指标 → 最小样本量 → ICE/PIE 排序 → 风险]",
      }),
      defineAgentOutputSection({
        title: "长期重构建议",
        body: "[超出实验范围的结构性改造方向]",
      }),
      defineAgentOutputSection({
        title: "测量与归因校准",
        body: "[需要修复的事件、归因模型、显著性陷阱]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未触达的页面 / 渠道 / 用户段]",
      }),
    ],
  }),
  qualityStandards: [
    "每条问题必须有可观测证据：转化率数字、热图、用户访谈、竞品对照或可视截图位置。",
    "实验必须可独立验证：不允许同时改多个变量而无法归因。",
    "区分「文案问题」「结构问题」「技术问题」「数据问题」，避免错误归责。",
    "对低流量场景给出最小样本量与替代方案（用户访谈、可用性测试），不强推统计实验。",
    "不假装跑过未运行的工具或访问过未触达的数据；缺数据要显式标注。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供 CRO 主干方法论：漏斗拆解、实验设计与假设排序。",
    },
    {
      id: redesignMyLandingpageSkill.id,
      mode: SkillUseMode.Preload,
      reason: "按转化最佳实践重构落地页结构与 CTA。",
    },
    {
      id: funnelArchitectSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计或审计从流量入口到成交的漏斗路径。",
    },
    {
      id: analyticsTrackingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "校准转化事件埋点，确保漏斗数据可信。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条优化建议绑定可观测证据与数据来源。",
    }
  ],
});
