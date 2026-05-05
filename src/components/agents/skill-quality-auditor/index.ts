import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认审计范围：单个 skill / 单个 plugin / 全仓库；明确用户关心的维度（结构、知识覆盖、触发、重复、telemetry）。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: `区分四类问题，分别派发对应 skill：
 - 设计评分（结构、frontmatter、knowledge delta）→ skill-evaluator Mode A
 - 知识覆盖度（闭卷考能否独立支撑任务）→ skill-evaluator Mode B
 - description 触发表达（CSO、shortcut 风险、模板违规）→ skill-activation-analyzer（静态审查模式）
 - 路由行为（漏触发、误触发、多 skill 抢请求）→ skill-activation-analyzer
 - 单次 eval 输出评分（transcript + outputs + expectations）→ skill-eval-grader
 - A/B 输出盲评（隐藏来源，只看输出质量）→ blind-output-comparator
 - benchmark 胜负归因与改进建议 → benchmark-result-analyzer
 - 运行时遥测（hook/skill telemetry、误触发、错误热点）→ trigger-telemetry-advisor
 - 库存治理（重复、低质量、README 同步）→ skills-prune-and-sync-readme（只读跑 audit）`,
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "把结论归入自组织、自激励、自约束、自协同四类机制，避免把治理缺口都简化成“新增 skill”。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "优先跑 scripts/skill-quality-report.mjs --json 与 scripts/trigger-audit-report.mjs --days N 建立全局基线，再针对异常 skill 做单点诊断。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Skill 质量审计报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "执行摘要",
        body: "[关键结论 + 可信度，先判断后依据]",
      }),
      defineAgentOutputSection({
        title: "审计基线",
        body: "[运行的脚本、参数、采样窗口、覆盖 skill 数]",
      }),
      defineAgentOutputSection({
        title: "设计评分发现",
        body: "[skill-evaluator 维度问题：结构、frontmatter、knowledge delta，引用文件路径]",
      }),
      defineAgentOutputSection({
        title: "触发域风险",
        body: "[skill-activation-analyzer 发现：shortcut、模板违规、重叠矩阵摘录]",
      }),
      defineAgentOutputSection({
        title: "知识覆盖缺口",
        body: "[skill-evaluator 闭卷题目分布、失败题、推断的知识漏洞]",
      }),
      defineAgentOutputSection({
        title: "运行时遥测信号",
        body: "[trigger-telemetry-advisor 抽取的命中率、错误热点、噪音 skill]",
      }),
      defineAgentOutputSection({
        title: "自运行闭环",
        body: "[自组织 / 自激励 / 自约束 / 自协同分别缺什么；只列有证据的缺口]",
      }),
      defineAgentOutputSection({
        title: "库存治理建议",
        body: "[重复 skill、低质量 skill、README 同步缺口；只列证据，不执行删除]",
      }),
      defineAgentOutputSection({
        title: "优先修复",
        body: "[按影响面 × 修复成本排序，标注负责的 skill]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未覆盖的 plugin / 时间窗口 / 数据缺失]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于跑仓库内只读脚本（`skill-quality-report.mjs`、`trigger-audit-report.mjs`、`hook-telemetry-report.mjs`、`audit-skill-evals.mjs`、`curate_skills.mjs audit`）、git 历史与文件统计。禁止运行 `--apply`/`--write`/`prune --delete` 类带写效果的子命令，禁止安装依赖或修改 telemetry。",
  ],
  qualityStandards: [
    "严格区分静态质量（结构/CSO）与运行时质量（telemetry）；不混用证据。",
    "不基于模糊相似度直接建议删除 skill，必须有 `curate_skills.mjs audit` 等证据。",
    "触发域冲突必须用矩阵或具体重叠词汇支撑，不写「感觉重叠」。",
    "不修改任何 skill、README 或 telemetry 文件；改动建议交回主对话执行。",
  ],
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
