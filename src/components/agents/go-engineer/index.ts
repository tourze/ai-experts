import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { goCliSkill } from "../../skills/go-cli/index";
import { goGrpcSkill } from "../../skills/go-grpc/index";
import { goConcurrencyPatternsSkill } from "../../skills/go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../../skills/go-error-handling/index";
import { goCodeStyleSkill } from "../../skills/go-code-style/index";
import { goDesignPatternsSkill } from "../../skills/go-design-patterns/index";
import { goStructsInterfacesSkill } from "../../skills/go-structs-interfaces/index";
import { goDataStructuresSkill } from "../../skills/go-data-structures/index";
import { goDatabaseSkill } from "../../skills/go-database/index";
import { goPerformanceSkill } from "../../skills/go-performance/index";
import { goSecuritySkill } from "../../skills/go-security/index";
import { goObservabilitySkill } from "../../skills/go-observability/index";
import { goTestingPatternsSkill } from "../../skills/go-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { goTroubleshootingSkill } from "../../skills/go-troubleshooting/index";
import { goLintSkill } from "../../skills/go-lint/index";

export const goEngineerAgent = defineAgent({
  id: "go-engineer",
  description: "当需要端到端设计或实现 Go 项目时使用——覆盖 CLI 设计、gRPC 服务、并发模型、错误处理、数据库访问、性能优化、安全审查、可观测性建设与测试策略。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Go 工程师。你可以读取项目源码、配置与依赖，设计方案并在用户指定目录下编写或修改 Go 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: goCliSkill.id,
      mode: SkillUseMode.Preload,
      reason: goCliSkill.description,
    },
    {
      id: goGrpcSkill.id,
      mode: SkillUseMode.Preload,
      reason: goGrpcSkill.description,
    },
    {
      id: goConcurrencyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: goConcurrencyPatternsSkill.description,
    },
    {
      id: goErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: goErrorHandlingSkill.description,
    },
    {
      id: goCodeStyleSkill.id,
      mode: SkillUseMode.Preload,
      reason: goCodeStyleSkill.description,
    },
    {
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: goDesignPatternsSkill.description,
    },
    {
      id: goStructsInterfacesSkill.id,
      mode: SkillUseMode.Preload,
      reason: goStructsInterfacesSkill.description,
    },
    {
      id: goDataStructuresSkill.id,
      mode: SkillUseMode.Preload,
      reason: goDataStructuresSkill.description,
    },
    {
      id: goDatabaseSkill.id,
      mode: SkillUseMode.Preload,
      reason: goDatabaseSkill.description,
    },
    {
      id: goPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: goPerformanceSkill.description,
    },
    {
      id: goSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: goSecuritySkill.description,
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: goObservabilitySkill.description,
    },
    {
      id: goTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: goTestingPatternsSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: goTroubleshootingSkill.description,
    },
    {
      id: goLintSkill.id,
      mode: SkillUseMode.Preload,
      reason: goLintSkill.description,
    }
  ],
});
