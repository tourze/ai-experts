import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const thinkingPartnerSkill = defineSkill({
  id: "thinking-partner",
  fullName: "思考拍档",
  description: "当用户思路混乱、不知道怎么办、需要有人一起理清局面和锁定核心问题时使用。用户提到\"我现在很乱\"\"帮我理一理\"\"我卡住了\"时触发。",
  useCases: [
    "用户说“我现在很乱”“不知道怎么办”“帮我理一理”“我卡住了”。",
    "局面里同时混着目标、限制、情绪和执行问题，需要先找主导矛盾。",
    "用户需要有人一起思考，而不是直接听一堆标准答案。",
    "如果用户其实只是要给任务排先后，优先转到 [priority-judge](../priority-judge/SKILL.md)。",
    "如果用户已经有明确方案，只想做压力测试，转到 [grill-me](../grill-me/SKILL.md)。",
    "如果用户想通过被提问来自己发现答案，转到 [socratic-teaching](references/socratic-teaching.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "socratic-teaching",
      source: new URL("./references/socratic-teaching.md", import.meta.url),
      target: "references/socratic-teaching.md",
      title: "socratic-teaching.md",
      summary: "Reference material for thinking-partner.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
