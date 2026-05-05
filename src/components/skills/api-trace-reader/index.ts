import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const apiTraceReaderSkill = defineSkill({
  id: "api-trace-reader",
  description: "在需要只读追踪接口、任务、事件或定时任务的调用链时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "entry-types",
      source: new URL("./references/entry-types.md", import.meta.url),
      target: "references/entry-types.md",
      title: "entry-types.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-example",
      source: new URL("./references/output-example.md", import.meta.url),
      target: "references/output-example.md",
      title: "output-example.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "risk-rubric",
      source: new URL("./references/risk-rubric.md", import.meta.url),
      target: "references/risk-rubric.md",
      title: "risk-rubric.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for api-trace-reader.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
