import {
  AgentSandbox,
  defineAgent,
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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: architectureDesignWorkflowSkill.id,
      mode: SkillUseMode.Preload,
      reason: architectureDesignWorkflowSkill.description,
    },
    {
      id: systemDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: systemDesignSkill.description,
    },
    {
      id: architectureDecisionRecordsSkill.id,
      mode: SkillUseMode.Preload,
      reason: architectureDecisionRecordsSkill.description,
    },
    {
      id: protocolFreezingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: protocolFreezingPatternsSkill.description,
    },
    {
      id: crossPlatformAdapterPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: crossPlatformAdapterPatternsSkill.description,
    },
    {
      id: hierarchicalMatchingSystemsSkill.id,
      mode: SkillUseMode.Preload,
      reason: hierarchicalMatchingSystemsSkill.description,
    },
    {
      id: webPerformanceDiagnosisSkill.id,
      mode: SkillUseMode.Preload,
      reason: webPerformanceDiagnosisSkill.description,
    },
    {
      id: taskDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: taskDecomposerSkill.description,
    },
    {
      id: backendToFrontendHandoffDocsSkill.id,
      mode: SkillUseMode.Preload,
      reason: backendToFrontendHandoffDocsSkill.description,
    },
    {
      id: agentOrchestrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: agentOrchestrationSkill.description,
    },
    {
      id: errorHandlingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: errorHandlingPatternsSkill.description,
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: softwareDesignSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
