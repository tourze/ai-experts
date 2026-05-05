import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goObservabilitySkill = defineSkill({
  id: "go-observability",
  fullName: "go-observability",
  description: "当 Go 代码需要日志、指标、链路追踪、告警或可观测性体系建设时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "logging",
      source: new URL("./references/logging.md", import.meta.url),
      target: "references/logging.md",
      title: "logging.md",
      summary: "Reference material for go-observability.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-observability.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
