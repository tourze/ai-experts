import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
