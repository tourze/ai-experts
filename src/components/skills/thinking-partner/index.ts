import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const thinkingPartnerSkill = defineSkill({
  id: "thinking-partner",
  description: "当用户思路混乱、不知道怎么办、需要有人一起理清局面和锁定核心问题时使用。用户提到\"我现在很乱\"\"帮我理一理\"\"我卡住了\"时触发。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for thinking-partner.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
