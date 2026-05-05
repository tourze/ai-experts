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
import { codebaseArchitectureAnalysisSkill } from "../../skills/codebase-architecture-analysis/index";
import { architectureReviewerSkill } from "../../skills/architecture-reviewer/index";
import { deepCodeReadSkill } from "../../skills/deep-code-read/index";
import { apiTraceReaderSkill } from "../../skills/api-trace-reader/index";
import { refactoringPatternsSkill } from "../../skills/refactoring-patterns/index";
import { techDebtSkill } from "../../skills/tech-debt/index";
import { softwareDesignSkill } from "../../skills/software-design/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const codebaseAnalystAgent = defineAgent({
  id: "codebase-analyst",
  description: "当需要分析代码库或目录架构时使用。它以只读方式梳理模块边界、依赖流、分层违规、状态流和结构风险。",
  role: `你是资深软件架构师。你只能读取、搜索和分析，不修改任何工作区文件。`,
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
    title: "架构分析报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "概览",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "调用链路",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "模块地图",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "依赖图",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "状态流地图",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "修改指南",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "发现",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "结构健康度评分",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "优先改进项",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "优先处理安全、正确性、数据完整性和用户可见风险。",
    "区分框架惯例、主观风格偏好和必须修复的问题。",
    "发现性能问题时说明触发条件、影响范围和验证方式。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codebaseArchitectureAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供模块地图到改进项的系统化架构分析。",
    },
    {
      id: architectureReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评审架构设计与代码库结构风险。",
    },
    {
      id: deepCodeReadSkill.id,
      mode: SkillUseMode.Preload,
      reason: "深度理解不熟悉代码库并生成认知产物。",
    },
    {
      id: apiTraceReaderSkill.id,
      mode: SkillUseMode.Preload,
      reason: "追踪接口调用链以梳理模块依赖。",
    },
    {
      id: refactoringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供重构手法选择与代码异味识别。",
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: "盘点技术债并生成治理优先级。",
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供职责拆分与耦合评价的设计原则。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条架构发现绑定文件:行证据。",
    }
  ],
});
