import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fishboneDiagramSkill = defineSkill({
  id: "fishbone-diagram",
  fullName: "鱼骨图（因果分析图）",
  description: "当用户要用鱼骨图、Ishikawa 或 5 Whys 做根因分析和因果排查时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "five-w-two-h",
      source: new URL("./references/five-w-two-h.md", import.meta.url),
      target: "references/five-w-two-h.md",
      title: "five-w-two-h.md",
      summary: "Reference material for fishbone-diagram.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for fishbone-diagram.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
