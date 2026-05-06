import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineAsset,
  defineReference,
  defineSkill,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "过拟合测试用例：在 3 个测试 prompt 上通过就发布，真实用户措辞不同导致 80% 失败。",
      pass: "从反馈中泛化：每个 FAIL/PASS 实例提炼出原则，编码原则而非具体修复，用 5+ 种措辞变体测试才发布。",
    }),
    defineAntiPattern({
      fail: "MUST/NEVER 地毯式轰炸：ALWAYS 用这个格式、NEVER 偏离、MUST 按 12 步执行——僵化脆弱，模型忽略大部分。",
      pass: "解释为什么：从用户目标出发而非输出格式，说明为什么用 JSON（下游工具解析），模型理解动机后能智能适应。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    "skill-creator-aggregate-benchmark",
    "skill-creator-generate-review",
    "skill-creator-generate-report",
    "skill-creator-improve-description",
    "skill-creator-package-skill",
    "skill-creator-quick-validate",
    "skill-creator-run-eval",
    "skill-creator-run-loop",
    "skill-creator-utils",
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
