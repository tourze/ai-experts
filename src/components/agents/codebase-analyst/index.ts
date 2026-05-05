import {
  AgentSandbox,
  defineAgent,
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
