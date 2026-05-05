import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { skillEvaluatorSkill } from "../../skills/skill-evaluator/index.js";
import { skillActivationAnalyzerSkill } from "../../skills/skill-activation-analyzer/index.js";
import { skillEvalGraderSkill } from "../../skills/skill-eval-grader/index.js";
import { blindOutputComparatorSkill } from "../../skills/blind-output-comparator/index.js";
import { benchmarkResultAnalyzerSkill } from "../../skills/benchmark-result-analyzer/index.js";
import { triggerTelemetryAdvisorSkill } from "../../skills/trigger-telemetry-advisor/index.js";
import { skillsPruneAndSyncReadmeSkill } from "../../skills/skills-prune-and-sync-readme/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const skillQualityAuditorAgent = defineAgent({
  id: "skill-quality-auditor",
  description: "当需要审计仓库 skill 质量、诊断触发命中、为 SKILL 设计打分、闭卷验证知识覆盖、扫描 description 路由风险或定位重复 skill 时使用。它只读分析，不修改任何 skill 文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
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
    },
    {
      id: triggerTelemetryAdvisorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: skillsPruneAndSyncReadmeSkill.id,
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
