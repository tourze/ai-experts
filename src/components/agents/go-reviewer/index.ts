import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { goCliSkill } from "../../skills/go-cli/index";
import { goGrpcSkill } from "../../skills/go-grpc/index";
import { goTroubleshootingSkill } from "../../skills/go-troubleshooting/index";
import { goConcurrencyPatternsSkill } from "../../skills/go-concurrency-patterns/index";
import { goTestingPatternsSkill } from "../../skills/go-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { goErrorHandlingSkill } from "../../skills/go-error-handling/index";
import { goCodeStyleSkill } from "../../skills/go-code-style/index";
import { goPerformanceSkill } from "../../skills/go-performance/index";
import { goSecuritySkill } from "../../skills/go-security/index";
import { goDesignPatternsSkill } from "../../skills/go-design-patterns/index";
import { goLintSkill } from "../../skills/go-lint/index";
import { goStructsInterfacesSkill } from "../../skills/go-structs-interfaces/index";
import { goDataStructuresSkill } from "../../skills/go-data-structures/index";
import { goDatabaseSkill } from "../../skills/go-database/index";
import { goObservabilitySkill } from "../../skills/go-observability/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const goReviewerAgent = defineAgent({
  id: "go-reviewer",
  description: "当需要执行 Go 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
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
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: goTroubleshootingSkill.description,
    },
    {
      id: goConcurrencyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: goConcurrencyPatternsSkill.description,
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
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: goDesignPatternsSkill.description,
    },
    {
      id: goLintSkill.id,
      mode: SkillUseMode.Preload,
      reason: goLintSkill.description,
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
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: goObservabilitySkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
