import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { skillCreatorSkill } from "../../skills/skill-creator/index.js";
import { skillEvolverSkill } from "../../skills/skill-evolver/index.js";
import { findSkillsSkill } from "../../skills/find-skills/index.js";
import { skillEvaluatorSkill } from "../../skills/skill-evaluator/index.js";
import { skillActivationAnalyzerSkill } from "../../skills/skill-activation-analyzer/index.js";
import { skillEvalGraderSkill } from "../../skills/skill-eval-grader/index.js";
import { blindOutputComparatorSkill } from "../../skills/blind-output-comparator/index.js";
import { benchmarkResultAnalyzerSkill } from "../../skills/benchmark-result-analyzer/index.js";

export const skillAuthorAgent = defineAgent({
  id: "skill-author",
  description: "当需要创建新 skill、根据参考 skill 演化目标 skill、跑 with-skill vs baseline 基准测试、或发现并集成外部 skill 时使用。它可以写入新的 SKILL.md、references、scripts、evals 等交付物，但不修改无关代码。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: skillCreatorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: skillEvolverSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: findSkillsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: skillEvaluatorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: skillActivationAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: skillEvalGraderSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: blindOutputComparatorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: benchmarkResultAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
