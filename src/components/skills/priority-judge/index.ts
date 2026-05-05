import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const priorityJudgeSkill = defineSkill({
  id: "priority-judge",
  fullName: "优先级判断助手",
  description: "当用户要给待办、项目、机会、风险或资源约束排优先级，决定先做什么、暂缓什么、放弃什么时使用。",
  useCases: [
    "用户说“我有很多事要做”“帮我排个优先级”“今天先做什么”。",
    "待办很多，但真正要先动手的事情不清楚。",
    "需要把“现在做”“先澄清再做”“有余力再做”“暂缓”分开。",
    "如果用户连核心目标都说不清，先用 [thinking-partner](../thinking-partner/SKILL.md) 把问题理顺。",
    "如果用户在两个高风险方向间犹豫，可结合 [what-if-oracle](../what-if-oracle/SKILL.md) 做分支推演。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
