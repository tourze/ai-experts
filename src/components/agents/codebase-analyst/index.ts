import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codebaseArchitectureAnalysisSkill } from "../../skills/codebase-architecture-analysis/index.js";
import { architectureReviewerSkill } from "../../skills/architecture-reviewer/index.js";
import { deepCodeReadSkill } from "../../skills/deep-code-read/index.js";
import { apiTraceReaderSkill } from "../../skills/api-trace-reader/index.js";
import { refactoringPatternsSkill } from "../../skills/refactoring-patterns/index.js";
import { techDebtSkill } from "../../skills/tech-debt/index.js";
import { softwareDesignSkill } from "../../skills/software-design/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const codebaseAnalystAgent = defineAgent({
  id: "codebase-analyst",
  description: "当需要分析代码库或目录架构时使用。它以只读方式梳理模块边界、依赖流、分层违规、状态流和结构风险。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codebaseArchitectureAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: architectureReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: deepCodeReadSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: apiTraceReaderSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: refactoringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: softwareDesignSkill.id,
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
