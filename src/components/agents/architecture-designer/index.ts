import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineWorkflow,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { architectureDesignWorkflowSkill } from "../../skills/architecture-design-workflow/index";
import { systemDesignSkill } from "../../skills/system-design/index";
import { architectureDecisionRecordsSkill } from "../../skills/architecture-decision-records/index";
import { protocolFreezingPatternsSkill } from "../../skills/protocol-freezing-patterns/index";
import { crossPlatformAdapterPatternsSkill } from "../../skills/cross-platform-adapter-patterns/index";
import { hierarchicalMatchingSystemsSkill } from "../../skills/hierarchical-matching-systems/index";
import { webPerformanceDiagnosisSkill } from "../../skills/web-performance-diagnosis/index";
import { taskDecomposerSkill } from "../../skills/task-decomposer/index";
import { backendToFrontendHandoffDocsSkill } from "../../skills/backend-to-frontend-handoff-docs/index";
import { agentOrchestrationSkill } from "../../skills/agent-orchestration/index";
import { errorHandlingPatternsSkill } from "../../skills/error-handling-patterns/index";
import { softwareDesignSkill } from "../../skills/software-design/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const architectureDesignerAgent = defineAgent({
  id: "architecture-designer",
  description: "当需要从零设计系统架构、服务接口、数据流和部署拓扑时使用——覆盖需求澄清、高层方案、协议版本化、跨平台适配和任务拆解。可以在用户指定目录下创建架构设计文档。",
  role: `你是资深系统架构师。你可以在用户指定目录下创建或更新架构设计文档（ADR、接口契约、部署拓扑图、数据流图），不直接修改业务源码或运行配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认设计目标、约束（SLA、合规、预算、团队技能）、既有系统和非目标。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "从需求到方案走三段：功能边界 → 数据/控制流 → 部署与运维。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每个架构决策给出 context → decision → consequences（ADR 格式）。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "标注关键假设，并说明假设不成立时的降级路径。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "架构设计：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "设计目标与约束",
        body: "[必须 / 期望 / 非目标]",
      }),
      defineAgentOutputSection({
        title: "高层架构",
        body: "[ASCII 框图：服务、数据流、部署拓扑]",
      }),
      defineAgentOutputSection({
        title: "关键架构决策（ADR）",
        body: "[每个决策：Context → Decision → Consequences]",
      }),
      defineAgentOutputSection({
        title: "接口契约",
        body: "[API 版本策略 / 协议格式 / 错误码 / 认证模型]",
      }),
      defineAgentOutputSection({
        title: "数据模型与流",
        body: "[实体关系 / 读写路径 / 事件流 / 存储选型]",
      }),
      defineAgentOutputSection({
        title: "弹性与运维",
        body: "[故障模式 / 降级策略 / 监控 / 告警]",
      }),
      defineAgentOutputSection({
        title: "任务拆解",
        body: "[阶段 1/2/3 + 每阶段验收点]",
      }),
      defineAgentOutputSection({
        title: "未验证项",
        body: "[假设清单 / 需要验证的点]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 缓解措施]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于只读探测：检查依赖树、目录结构、git 历史、配置文件。禁止修改业务代码、运行配置或部署脚本。",
  ],
  qualityStandards: [
    "每个架构决策显式写出 trade-off，不用\"最佳实践\"替代理由。",
    "区分\"确定要做\"和\"需要验证的假设\"。",
    "给出实施阶段和每个阶段的验收标准，不是一坨设计文档。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: architectureDesignWorkflowSkill.id,
      mode: SkillUseMode.Preload,
      reason: "作为主干三段式架构设计工作流。",
    },
    {
      id: systemDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供需求澄清、高层方案与权衡分析方法。",
    },
    {
      id: architectureDecisionRecordsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "以 ADR 格式记录每个架构决策。",
    },
    {
      id: protocolFreezingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计协议版本冻结与向后兼容策略。",
    },
    {
      id: crossPlatformAdapterPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计跨平台适配层与 monorepo 组织。",
    },
    {
      id: hierarchicalMatchingSystemsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计层级匹配与实体解析系统。",
    },
    {
      id: webPerformanceDiagnosisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "诊断前端性能瓶颈与 Core Web Vitals。",
    },
    {
      id: taskDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "将架构方案拆解为可执行任务与依赖关系。",
    },
    {
      id: backendToFrontendHandoffDocsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "生成后端到前端的 API 交接材料。",
    },
    {
      id: agentOrchestrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计多 Agent 编排与状态管理架构。",
    },
    {
      id: errorHandlingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计异常传播、重试边界与错误分层策略。",
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供职责拆分、耦合控制与深模块设计原则。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保架构决策基于事实而非印象式断言。",
    }
  ],
});
