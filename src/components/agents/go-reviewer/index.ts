import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index.js";
import { goCliSkill } from "../../skills/go-cli/index.js";
import { goGrpcSkill } from "../../skills/go-grpc/index.js";
import { goTroubleshootingSkill } from "../../skills/go-troubleshooting/index.js";
import { goConcurrencyPatternsSkill } from "../../skills/go-concurrency-patterns/index.js";
import { goTestingPatternsSkill } from "../../skills/go-testing-patterns/index.js";
import { testingPatternsSkill } from "../../skills/testing-patterns/index.js";
import { goErrorHandlingSkill } from "../../skills/go-error-handling/index.js";
import { goCodeStyleSkill } from "../../skills/go-code-style/index.js";
import { goPerformanceSkill } from "../../skills/go-performance/index.js";
import { goSecuritySkill } from "../../skills/go-security/index.js";
import { goDesignPatternsSkill } from "../../skills/go-design-patterns/index.js";
import { goLintSkill } from "../../skills/go-lint/index.js";
import { goStructsInterfacesSkill } from "../../skills/go-structs-interfaces/index.js";
import { goDataStructuresSkill } from "../../skills/go-data-structures/index.js";
import { goDatabaseSkill } from "../../skills/go-database/index.js";
import { goObservabilitySkill } from "../../skills/go-observability/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

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
      id: goTroubleshootingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goConcurrencyPatternsSkill.id,
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
      id: goDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: goLintSkill.id,
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
      id: goObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
