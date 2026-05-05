import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const consciousnessCouncilSkill = defineSkill({
  id: "consciousness-council",
  description: "当需要多视角思辨审视高不确定性决策、角色辩论、专家议会、风险分歧和取舍盲区时使用。支持角色议会模式和六顶思考帽模式。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-configurations",
      source: new URL("./references/advanced-configurations.md", import.meta.url),
      target: "references/advanced-configurations.md",
      title: "advanced-configurations.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-api-testing-example",
      source: new URL("./references/six-hats-api-testing-example.md", import.meta.url),
      target: "references/six-hats-api-testing-example.md",
      title: "six-hats-api-testing-example.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-guide",
      source: new URL("./references/six-hats-guide.md", import.meta.url),
      target: "references/six-hats-guide.md",
      title: "six-hats-guide.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-solo-template",
      source: new URL("./references/six-hats-solo-template.md", import.meta.url),
      target: "references/six-hats-solo-template.md",
      title: "six-hats-solo-template.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-team-template",
      source: new URL("./references/six-hats-team-template.md", import.meta.url),
      target: "references/six-hats-team-template.md",
      title: "six-hats-team-template.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for consciousness-council.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
