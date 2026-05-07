import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, skillCreatorAggregateBenchmark, skillCreatorGenerateReview, skillCreatorGenerateReport, skillCreatorImproveDescription, skillCreatorPackageSkill, skillCreatorQuickValidate, skillCreatorRunEval, skillCreatorRunLoop } from "../../procedures/index";

export const skillCreatorSkill = defineSkill({
  id: "skill-creator",
  fullName: "Skill Creator",
  description: "当用户要创建新 skill、编辑或改进已有 skill、运行 eval、基准测试 skill 表现，或优化 skill 的 frontmatter description 触发效果时使用。",
  useCases: [
    "当用户要创建新 skill、编辑或改进已有 skill、运行 eval、基准测试 skill 表现，或优化 skill 的 frontmatter description 触发效果时使用。",
  ],
  constraints: [
    "先判断用户处在创建、编辑、eval、迭代、description 优化或打包的哪一步，再从对应步骤接上。",
    "不要把来源材料全部塞进 skill；只保留会改变 agent 行为的知识、流程、红线和示例。",
    "可客观验证的 skill 默认要有 eval；主观创意类 skill 默认用定性 review，除非用户要求量化。",
    "with-skill 和 baseline/old-skill 运行必须同一轮启动，避免时间和上下文偏差。",
    "改进时从反馈中泛化原则，不为少数 eval prompt 过拟合。",
    "description 优化必须使用真实 should-trigger / should-not-trigger queries，并由 held-out test score 选择 best description。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先捕获意图：skill 要让 agent 做什么、何时触发、期望输出、是否需要 eval，以及来源材料是什么。",
      "写或改 skill 时聚焦 expert-only 行为增量，把细节拆到 references/assets/procedures，保持主说明短而可执行。",
      "设计 2-3 个真实 eval prompts，压力敏感 skill 至少包含一个诱导跳过规则的 prompt；保存到 `evals/evals.json`。",
      "运行评估时为每个 eval 同轮启动 with-skill 和 baseline/old-skill，创建 workspace/iteration/eval 目录和 metadata。",
      "运行期间起草客观 assertions，完成后记录 timing，评分生成 `grading.json`，聚合 benchmark 并用 review viewer 收集用户反馈。",
      "根据反馈泛化原则、精简无效指令、补 Procedure、eval 辅助代码或 references，再进入下一轮 iteration。",
      "创建或改进完成后，可运行 description optimization：生成真实触发 eval queries、让用户 review、运行优化 loop、应用 best_description。",
      "需要交付时使用 package procedure 打包，并按环境差异处理 Claude.ai、Cowork、headless viewer 和只读安装路径。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Skill 设计包：目标、触发 description、约束、流程、反模式、references/assets/procedures 和 eval 计划。",
      "Eval 迭代产物：workspace、metadata、assertions、timing、grading、benchmark、viewer feedback 和改进记录。",
      "交付结果：before/after description、held-out 分数、打包路径、剩余风险和下一轮验证建议。",
    ],
  }),
  procedures: [
    procedureUse(skillCreatorAggregateBenchmark),
    procedureUse(skillCreatorGenerateReview),
    procedureUse(skillCreatorGenerateReport),
    procedureUse(skillCreatorImproveDescription),
    procedureUse(skillCreatorPackageSkill),
    procedureUse(skillCreatorQuickValidate),
    procedureUse(skillCreatorRunEval, { platforms: [Platform.Claude] }),
    procedureUse(skillCreatorRunLoop, { platforms: [Platform.Claude] }),
  ],
  references: [
    defineReference({
      id: "creation-guidelines",
      source: new URL("./references/creation-guidelines.md", import.meta.url),
      target: "references/creation-guidelines.md",
      title: "creation-guidelines.md",
      summary: "Skill 创建与改写指南：意图捕获、来源检查、写作结构、渐进披露和测试 prompt 设计。",
      loadWhen: "需要创建新 skill、整理用户工作流、改写 SKILL.md 或设计初始 eval prompts 时读取。",
    }),
    defineReference({
      id: "evaluation-loop",
      source: new URL("./references/evaluation-loop.md", import.meta.url),
      target: "references/evaluation-loop.md",
      title: "evaluation-loop.md",
      summary: "Skill 评估与迭代闭环：workspace 结构、baseline/with-skill 同轮运行、assertions、grading、benchmark、viewer 和反馈处理。",
      loadWhen: "需要运行 skill eval、生成 benchmark、打开 review viewer 或根据反馈迭代 skill 时读取。",
    }),
    defineReference({
      id: "description-optimization",
      source: new URL("./references/description-optimization.md", import.meta.url),
      target: "references/description-optimization.md",
      title: "description-optimization.md",
      summary: "Skill frontmatter description 触发优化流程：eval query 生成、用户 review、优化 loop、结果应用和打包适配。",
      loadWhen: "需要优化 skill 触发准确率、运行 description optimization、打包 skill 或适配 Claude.ai/Cowork 时读取。",
    }),
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
    }),
    defineAsset({
      id: "eval-viewer",
      source: new URL("./assets/eval-viewer/viewer.html", import.meta.url),
      target: "assets/eval-viewer/viewer.html",
    }),
  ],
});
