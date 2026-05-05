import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const meetingInsightsAnalyzerSkill = defineSkill({
  id: "meeting-insights-analyzer",
  description: "当需要基于会议转写做沟通行为复盘、发言占比、打断频率、引导风格或跨会议趋势分析时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "meeting-minutes",
      source: new URL("./references/meeting-minutes.md", import.meta.url),
      target: "references/meeting-minutes.md",
      title: "meeting-minutes.md",
      summary: "Reference material for meeting-insights-analyzer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "meeting-notes-and-actions",
      source: new URL("./references/meeting-notes-and-actions.md", import.meta.url),
      target: "references/meeting-notes-and-actions.md",
      title: "meeting-notes-and-actions.md",
      summary: "Reference material for meeting-insights-analyzer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for meeting-insights-analyzer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
