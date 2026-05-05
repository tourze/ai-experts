import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { skillEvaluatorSkill } from "../../skills/skill-evaluator/index";
import { skillActivationAnalyzerSkill } from "../../skills/skill-activation-analyzer/index";
import { skillEvalGraderSkill } from "../../skills/skill-eval-grader/index";
import { blindOutputComparatorSkill } from "../../skills/blind-output-comparator/index";
import { benchmarkResultAnalyzerSkill } from "../../skills/benchmark-result-analyzer/index";
import { triggerTelemetryAdvisorSkill } from "../../skills/trigger-telemetry-advisor/index";
import { skillsPruneAndSyncReadmeSkill } from "../../skills/skills-prune-and-sync-readme/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const skillQualityAuditorAgent = defineAgent({
  id: "skill-quality-auditor",
  description: "当需要审计仓库 skill 质量、诊断触发命中、为 SKILL 设计打分、闭卷验证知识覆盖、扫描 description 路由风险或定位重复 skill 时使用。它只读分析，不修改任何 skill 文件。",
  role: `你是资深 Skill 工程审计师。你只能读取、搜索和分析，不修改任何 skill 文件、README 或 telemetry 数据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
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
    },
    {
      id: triggerTelemetryAdvisorSkill.id,
      mode: SkillUseMode.Preload,
      reason: triggerTelemetryAdvisorSkill.description,
    },
    {
      id: skillsPruneAndSyncReadmeSkill.id,
      mode: SkillUseMode.Preload,
      reason: skillsPruneAndSyncReadmeSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
