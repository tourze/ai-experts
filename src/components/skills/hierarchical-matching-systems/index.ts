import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const hierarchicalMatchingSystemsSkill = defineSkill({
  id: "hierarchical-matching-systems",
  fullName: "hierarchical-matching-systems",
  description: "在设计、评审或排查层级匹配系统时使用，适用于稳定匹配、最优分配、实体解析、分班分组或岗位匹配等场景。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "algorithms",
      source: new URL("./references/algorithms.md", import.meta.url),
      target: "references/algorithms.md",
      title: "algorithms.md",
      summary: "Reference material for hierarchical-matching-systems.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "decision-guide",
      source: new URL("./references/decision-guide.md", import.meta.url),
      target: "references/decision-guide.md",
      title: "decision-guide.md",
      summary: "Reference material for hierarchical-matching-systems.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for hierarchical-matching-systems.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
