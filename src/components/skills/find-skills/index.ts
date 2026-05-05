import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const findSkillsSkill = defineSkill({
  id: "find-skills",
  fullName: "Find Skills",
  description: "当用户要查找适合任务的 skill、询问如何做某类工作或是否存在相关 skill 时使用。已知 skill 名称直接调用时不需要。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "search-guide",
      source: new URL("./references/search-guide.md", import.meta.url),
      target: "references/search-guide.md",
      title: "search-guide.md",
      summary: "Reference material for find-skills.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for find-skills.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
