import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { priorityJudgeSkill } from "../priority-judge/index";

export const whatIfOracleSkill = defineSkill({
  id: "what-if-oracle",
  fullName: "What-If 推演器",
  description: "当需要对不确定决策做未来分支推演、情景分析或最好/最坏情况评估时使用。用户提到\"如果会怎样\"\"有哪些可能性\"\"最好最坏情景\"时触发。",
  useCases: [
    "用户说“如果……会怎样”“我们有哪些可能性”“帮我做最好/最坏情景分析”。",
    "需要在多个可能未来之间做准备，而不是押注单一路径。",
    "适合战略、产品、职业、风险应对、资源配置等高不确定性问题。",
    "如果要先从失败角度找脆弱点，可先用 `inversion-strategist`。",
    "如果要给多个候选动作排当前优先级，可在推演后接 `priority-judge`。",
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
  checklist: [
    "问题是否已经被压缩成单变量分析。",
    "是否给出了 4-6 条互相区分清楚的分支。",
    "每条分支是否都有概率、信号、后果、动作。",
    "概率是否大致加总为 100%。",
    "是否提炼了跨分支都成立的稳健动作。",
    "是否明说“这是推演，不是预测”。",
  ],
  relatedSkills: [
    {
      get id() {
        return priorityJudgeSkill.id;
      },
      reason: "如果要给多个候选动作排当前优先级，可在推演后接 `priority-judge`。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      label: "inversion-strategist",
      reason: "如果要先从失败角度找脆弱点，可先用 `inversion-strategist`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "含糊问题",
      pass: "单变量收紧",
    }),
    defineAntiPattern({
      fail: "只有极端",
      pass: "覆盖最可能",
    }),
    defineAntiPattern({
      fail: "写成小说",
      pass: "信号 + 动作",
    }),
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
      summary: "贝叶斯决策框架，将分支概率、证据质量和行动代价转为结构化的决策建议。",
      loadWhen: "需要在推演后把分支概率和证据质量转为可执行的决策报告时读取。",
    }),
    defineReference({
      id: "scenario-templates",
      source: new URL("./references/scenario-templates.md", import.meta.url),
      target: "references/scenario-templates.md",
      title: "scenario-templates.md",
      summary: "不同领域的推演情景模板集合，覆盖战略、产品、技术和风险场景。",
      loadWhen: "需要按领域套用推演模板来快速生成情景分支时读取。",
    }),
  ],
});
