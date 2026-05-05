import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const analyticsTrackingSkill = defineSkill({
  id: "analytics-tracking",
  description: "在需要规划、审计或排查 GA4/GTM 埋点时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "tracking-plan-generator",
      entry: new URL("./scripts/tracking_plan_generator.mjs", import.meta.url),
      target: "scripts/tracking_plan_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script tracking_plan_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "campaign-analytics",
      source: new URL("./references/campaign-analytics.md", import.meta.url),
      target: "references/campaign-analytics.md",
      title: "campaign-analytics.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "debugging-playbook",
      source: new URL("./references/debugging-playbook.md", import.meta.url),
      target: "references/debugging-playbook.md",
      title: "debugging-playbook.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "event-taxonomy-guide",
      source: new URL("./references/event-taxonomy-guide.md", import.meta.url),
      target: "references/event-taxonomy-guide.md",
      title: "event-taxonomy-guide.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gtm-patterns",
      source: new URL("./references/gtm-patterns.md", import.meta.url),
      target: "references/gtm-patterns.md",
      title: "gtm-patterns.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for analytics-tracking.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
