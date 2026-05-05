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
  role: `你是资深软件架构师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codebaseArchitectureAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: codebaseArchitectureAnalysisSkill.description,
    },
    {
      id: architectureReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: architectureReviewerSkill.description,
    },
    {
      id: deepCodeReadSkill.id,
      mode: SkillUseMode.Preload,
      reason: deepCodeReadSkill.description,
    },
    {
      id: apiTraceReaderSkill.id,
      mode: SkillUseMode.Preload,
      reason: apiTraceReaderSkill.description,
    },
    {
      id: refactoringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: refactoringPatternsSkill.description,
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: techDebtSkill.description,
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
