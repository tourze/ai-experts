import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitTasksSkill = defineSkill({
  id: "speckit-tasks",
  description: "当用户要从规格和技术计划拆出任务清单、依赖顺序、并行标记或故事级任务时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for speckit-tasks.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
