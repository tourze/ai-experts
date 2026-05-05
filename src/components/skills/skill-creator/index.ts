import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const skillCreatorSkill = defineSkill({
  id: "skill-creator",
  fullName: "Skill Creator",
  description: "当用户要创建新 skill、编辑或改进已有 skill、运行 eval、基准测试 skill 表现，或优化 skill 的 frontmatter description 触发效果时使用。",
  useCases: [
    "当用户要创建新 skill、编辑或改进已有 skill、运行 eval、基准测试 skill 表现，或优化 skill 的 frontmatter description 触发效果时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "aggregate-benchmark",
      entry: new URL("./scripts/aggregate_benchmark.mjs", import.meta.url),
      target: "scripts/aggregate_benchmark.mjs",
      runtime: "node",
      bundle: false,
      description: "Script aggregate_benchmark.mjs.",
    }),
    defineSkillScript({
      id: "generate-report",
      entry: new URL("./scripts/generate_report.mjs", import.meta.url),
      target: "scripts/generate_report.mjs",
      runtime: "node",
      bundle: false,
      description: "Script generate_report.mjs.",
    }),
    defineSkillScript({
      id: "improve-description",
      entry: new URL("./scripts/improve_description.mjs", import.meta.url),
      target: "scripts/improve_description.mjs",
      runtime: "node",
      bundle: false,
      description: "Script improve_description.mjs.",
    }),
    defineSkillScript({
      id: "package-skill",
      entry: new URL("./scripts/package_skill.mjs", import.meta.url),
      target: "scripts/package_skill.mjs",
      runtime: "node",
      bundle: false,
      description: "Script package_skill.mjs.",
    }),
    defineSkillScript({
      id: "quick-validate",
      entry: new URL("./scripts/quick_validate.mjs", import.meta.url),
      target: "scripts/quick_validate.mjs",
      runtime: "node",
      bundle: false,
      description: "Script quick_validate.mjs.",
    }),
    defineSkillScript({
      id: "run-eval",
      entry: new URL("./scripts/run_eval.mjs", import.meta.url),
      target: "scripts/run_eval.mjs",
      runtime: "node",
      bundle: false,
      description: "Script run_eval.mjs.",
    }),
    defineSkillScript({
      id: "run-loop",
      entry: new URL("./scripts/run_loop.mjs", import.meta.url),
      target: "scripts/run_loop.mjs",
      runtime: "node",
      bundle: false,
      description: "Script run_loop.mjs.",
    }),
    defineSkillScript({
      id: "utils",
      entry: new URL("./scripts/utils.mjs", import.meta.url),
      target: "scripts/utils.mjs",
      runtime: "node",
      bundle: false,
      description: "Script utils.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "pressure-testing-methodology",
      source: new URL("./references/pressure-testing-methodology.md", import.meta.url),
      target: "references/pressure-testing-methodology.md",
      title: "pressure-testing-methodology.md",
      summary: "Skill 压力测试的方法论，包含测试场景、评估标准和结果分析框架。",
      loadWhen: "需要对创建或修改后的 skill 进行压力测试和稳健性评估时读取。",
    }),
    defineReference({
      id: "schemas",
      source: new URL("./references/schemas.md", import.meta.url),
      target: "references/schemas.md",
      title: "schemas.md",
      summary: "Skill 定义中各类数据模型的结构说明和字段约束参考。",
      loadWhen: "需要了解 skill 定义中数据结构字段含义或验证模式是否正确时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "eval-review",
      source: new URL("./assets/eval_review.html", import.meta.url),
      target: "assets/eval_review.html",
    })
  ],
});
