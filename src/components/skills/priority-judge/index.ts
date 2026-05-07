import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { thinkingPartnerSkill } from "../thinking-partner/index";
import { whatIfOracleSkill } from "../what-if-oracle/index";

export const priorityJudgeSkill = defineSkill({
  id: "priority-judge",
  fullName: "优先级判断助手",
  description: "当用户要给待办、项目、机会、风险或资源约束排优先级，决定先做什么、暂缓什么、放弃什么时使用。",
  useCases: [
    "用户说“我有很多事要做”“帮我排个优先级”“今天先做什么”。",
    "待办很多，但真正要先动手的事情不清楚。",
    "需要把“现在做”“先澄清再做”“有余力再做”“暂缓”分开。",
    "如果用户连核心目标都说不清，先用 `thinking-partner` 把问题理顺。",
    "如果用户在两个高风险方向间犹豫，可结合 `what-if-oracle` 做分支推演。",
  ],
  constraints: [
    "先完整收集待办，再排序；不要边听边武断下结论。",
    "主排序轴只有两个：清晰度（想清楚没有）和截止时间（什么时候必须完成）。",
    "“有截止但没想清楚”的任务，先安排澄清动作，而不是直接硬做。",
    "每次只锁定 1-2 个“现在就做”的任务，其余分流到后续或暂缓。",
    "不制造假精确，不把任务拆成 10 分钟颗粒度。",
    "只有用户明确要求留档时，才把结果整理成文档。",
  ],
  checklist: [
    "是否已经把用户脑中的待办尽量收全。",
    "每个任务是否都标了清晰度和截止时间。",
    "“现在做”的任务是否控制在 1-2 个。",
    "是否解释了为什么其他任务被延后。",
    "是否把需要先澄清的任务单独指出。",
    "是否避免了过度规划和伪精确时间表。",
  ],
  relatedSkills: [
    {
      get id() {
        return whatIfOracleSkill.id;
      },
      reason: "如果用户在两个高风险方向间犹豫，可结合 `what-if-oracle` 做分支推演。",
    },
    {
      get id() {
        return thinkingPartnerSkill.id;
      },
      reason: "如果用户连核心目标都说不清，先用 `thinking-partner` 把问题理顺。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全部 P0",
      pass: "只锁 1-2 个\"现在做\"",
    }),
    defineAntiPattern({
      fail: "拍脑袋假精确",
      pass: "粗粒度 + 留缓冲",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用清晰度和截止时间两条主轴，把待办分成现在做、然后做、先澄清和暂缓，避免全部任务都被当成 P0。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先完整收集待办、约束、截止时间、依赖和用户当前精力，不边听边排序。",
      "为每个任务标注清晰度、截止时间、影响、依赖和下一步是否明确。",
      "把任务分到四类：现在做、然后做、先澄清再做、暂缓/放弃。",
      "每轮只锁定 1-2 个现在做的任务；有截止但不清楚的任务先安排澄清动作。",
      "核心目标不清时联动 `thinking-partner`；高风险分支犹豫时联动 `what-if-oracle`。",
      "给出粗粒度行动顺序、延后理由和需要再次排序的触发条件。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "待办清单及清晰度、截止时间、依赖和下一步状态。",
      "现在做、然后做、先澄清、暂缓/放弃的分档结果。",
      "1-2 个立即任务及选择理由。",
      "延后理由、澄清动作和下一次重排触发条件。",
    ],
  }),
  tools: [],
});
