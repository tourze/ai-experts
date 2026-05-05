import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { pythonTypeSafetySkill } from "../../skills/python-type-safety/index";
import { pythonErrorHandlingSkill } from "../../skills/python-error-handling/index";
import { asyncPythonPatternsSkill } from "../../skills/async-python-patterns/index";
import { pythonPerformanceOptimizationSkill } from "../../skills/python-performance-optimization/index";
import { pythonDesignPatternsSkill } from "../../skills/python-design-patterns/index";
import { pythonObservabilitySkill } from "../../skills/python-observability/index";
import { pythonTestingPatternsSkill } from "../../skills/python-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { pythonBackgroundJobsSkill } from "../../skills/python-background-jobs/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const pythonReviewerAgent = defineAgent({
  id: "python-reviewer",
  description: "当需要执行 Python 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
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
      id: pythonTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: asyncPythonPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonPerformanceOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pythonBackgroundJobsSkill.id,
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
