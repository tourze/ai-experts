import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const whatIfOracleSkill = defineSkill({
  id: "what-if-oracle",
  fullName: "What-If 推演器",
  description: "当需要对不确定决策做未来分支推演、情景分析或最好/最坏情况评估时使用。用户提到\"如果会怎样\"\"有哪些可能性\"\"最好最坏情景\"时触发。",
  useCases: [
    "用户说“如果……会怎样”“我们有哪些可能性”“帮我做最好/最坏情景分析”。",
    "需要在多个可能未来之间做准备，而不是押注单一路径。",
    "适合战略、产品、职业、风险应对、资源配置等高不确定性问题。",
    "如果要先从失败角度找脆弱点，可先用 [inversion-strategist](../first-principles-decomposer/SKILL.md)。",
    "如果要给多个候选动作排当前优先级，可在推演后接 [priority-judge](../priority-judge/SKILL.md)。",
    "如果要把分支概率、证据质量和行动代价转成证据到行动报告，可接 [bayesian-decision](references/bayesian-decision.md)。",
    "需要按领域套模板时，参考 [scenario-templates.md](references/scenario-templates.md)。",
  ],
  constraints: [
    "先把问题压缩成单变量分析：变的是什么、幅度多大、时间窗口多久。",
    "每次生成 4-6 条分支，至少覆盖：最好、最可能、最坏、意外变量、反共识、二阶连锁。",
    "每条分支都要写清概率、触发信号、主要后果和应对动作。",
    "所有分支的概率总和应接近 100%；如果明显凑不满，说明漏了分支。",
    "输出的是“可能性地图”，不是预言；不能把估计写成确定结果。",
    "结尾必须给出稳健动作、对冲动作和决策触发器。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "bayesian-decision",
      source: new URL("./references/bayesian-decision.md", import.meta.url),
      target: "references/bayesian-decision.md",
      title: "bayesian-decision.md",
      summary: "Reference material for what-if-oracle.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scenario-templates",
      source: new URL("./references/scenario-templates.md", import.meta.url),
      target: "references/scenario-templates.md",
      title: "scenario-templates.md",
      summary: "Reference material for what-if-oracle.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
