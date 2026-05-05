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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goCliSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goGrpcSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goConcurrencyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goCodeStyleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goStructsInterfacesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goDataStructuresSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goDatabaseSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goLintSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
