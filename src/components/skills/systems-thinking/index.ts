import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const systemsThinkingSkill = defineSkill({
  id: "systems-thinking",
  description: "当用户要分析多方参与、激励错位、二阶效应或复杂系统动态时使用；帮助识别结构、反馈回路、杠杆点与系统性副作用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "channel-economics",
      source: new URL("./references/channel-economics.md", import.meta.url),
      target: "references/channel-economics.md",
      title: "channel-economics.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "greiner-growth-model",
      source: new URL("./references/greiner-growth-model.md", import.meta.url),
      target: "references/greiner-growth-model.md",
      title: "greiner-growth-model.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "value-chain-analysis",
      source: new URL("./references/value-chain-analysis.md", import.meta.url),
      target: "references/value-chain-analysis.md",
      title: "value-chain-analysis.md",
      summary: "Reference material for systems-thinking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for systems-thinking.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
