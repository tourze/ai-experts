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
import { iosSimulatorSkillSkill } from "../../skills/ios-simulator-skill/index";
import { swiftuiPerformanceAuditSkill } from "../../skills/swiftui-performance-audit/index";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const iosSimulatorSmokeTesterAgent = defineAgent({
  id: "ios-simulator-smoke-tester",
  description: "当需要用本目录 simulator 脚本执行 iOS 模拟器冒烟测试时使用。它启动或选择模拟器、启动 app、读取无障碍树、走关键流程并报告用户可见阻断。",
  role: `你是资深 iOS QA 工程师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "iOS 模拟器冒烟测试：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "环境",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "步骤",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "结果",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "后续",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "失败结果必须指出第一个用户可见失败步骤。",
    "不能跳过步骤后声称流程通过。",
    "证据要足够另一位工程师快速复现。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: iosSimulatorSkillSkill.id,
      mode: SkillUseMode.Preload,
      reason: iosSimulatorSkillSkill.description,
    },
    {
      id: swiftuiPerformanceAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: swiftuiPerformanceAuditSkill.description,
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: detoxMobileTestSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
