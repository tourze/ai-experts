import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const subagentDrivenDevelopmentSkill = defineSkill({
  id: "subagent-driven-development",
  description: "当用户明确要求子代理/worker/多 agent/并行实现，并需要按计划派遣与审查时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "prompt-templates",
      source: new URL("./references/prompt-templates.md", import.meta.url),
      target: "references/prompt-templates.md",
      title: "prompt-templates.md",
      summary: "Reference material for subagent-driven-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for subagent-driven-development.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
