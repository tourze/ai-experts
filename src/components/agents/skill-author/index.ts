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
  role: `你是资深 Skill 作者。你可以在用户请求的交付范围内创建或更新 \`src/components/skills/<skill>/\` 下的 SKILL.md、references、scripts、assets、evals 与对应 README 索引项，但不要修改无关源码、配置或其他 skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于跑 `scripts/skill-quality-report.mjs`、`scripts/run-skill-effect-benchmark.mjs`、`generate_review.py`、`scripts/cso_audit.mjs`、git 历史查询、`npm test` 等只读或本 skill 自身评测命令；禁止安装系统级依赖、删除 / 移动其他 skill 目录、运行破坏性命令。落盘前先用 `git status --short` 与 `git diff --stat` 自检改动范围。",
  ],
  qualityStandards: [
    "description 不允许包含工作流、输出格式、章节模板；只描述「什么时候用」。",
    "与既有 skill 触发域有重叠时必须显式列出分流条件，否则不允许落盘。",
    "任何写入组件索引的改动必须保持 skill 名字典序、无重复行。",
    "演化型修改保留 baseline 对照实证，不允许仅凭直觉宣称更好。",
    "不修改与本次 skill 无关的文件；安装脚本、hooks、其他 skill 一律保持原状。",
  ],
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
