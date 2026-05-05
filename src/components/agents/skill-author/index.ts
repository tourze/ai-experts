import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { skillCreatorSkill } from "../../skills/skill-creator/index";
import { skillEvolverSkill } from "../../skills/skill-evolver/index";
import { findSkillsSkill } from "../../skills/find-skills/index";
import { skillEvaluatorSkill } from "../../skills/skill-evaluator/index";
import { skillActivationAnalyzerSkill } from "../../skills/skill-activation-analyzer/index";
import { skillEvalGraderSkill } from "../../skills/skill-eval-grader/index";
import { blindOutputComparatorSkill } from "../../skills/blind-output-comparator/index";
import { benchmarkResultAnalyzerSkill } from "../../skills/benchmark-result-analyzer/index";

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
      reason: skillCreatorSkill.description,
    },
    {
      id: skillEvolverSkill.id,
      mode: SkillUseMode.Preload,
      reason: skillEvolverSkill.description,
    },
    {
      id: findSkillsSkill.id,
      mode: SkillUseMode.Preload,
      reason: findSkillsSkill.description,
    },
    {
      id: skillEvaluatorSkill.id,
      mode: SkillUseMode.Preload,
      reason: skillEvaluatorSkill.description,
    },
    {
      id: skillActivationAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: skillActivationAnalyzerSkill.description,
    },
    {
      id: skillEvalGraderSkill.id,
      mode: SkillUseMode.Preload,
      reason: skillEvalGraderSkill.description,
    },
    {
      id: blindOutputComparatorSkill.id,
      mode: SkillUseMode.Preload,
      reason: blindOutputComparatorSkill.description,
    },
    {
      id: benchmarkResultAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: benchmarkResultAnalyzerSkill.description,
    }
  ],
});
