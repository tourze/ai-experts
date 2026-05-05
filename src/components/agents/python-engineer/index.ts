import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { pythonTypeSafetySkill } from "../../skills/python-type-safety/index";
import { pythonErrorHandlingSkill } from "../../skills/python-error-handling/index";
import { asyncPythonPatternsSkill } from "../../skills/async-python-patterns/index";
import { pythonPerformanceOptimizationSkill } from "../../skills/python-performance-optimization/index";
import { pythonDesignPatternsSkill } from "../../skills/python-design-patterns/index";
import { pythonObservabilitySkill } from "../../skills/python-observability/index";
import { pythonTestingPatternsSkill } from "../../skills/python-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { pythonBackgroundJobsSkill } from "../../skills/python-background-jobs/index";
import { uvPackageManagerSkill } from "../../skills/uv-package-manager/index";

export const pythonEngineerAgent = defineAgent({
  id: "python-engineer",
  description: "当需要端到端设计或实现 Python 项目时使用——覆盖类型安全、错误处理、异步并发、性能优化、设计模式、后台任务、可观测性建设与测试策略。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
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
      id: uvPackageManagerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
