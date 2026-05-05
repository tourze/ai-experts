import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const paidAdsSkill = defineSkill({
  id: "paid-ads",
  description: "在需要规划、优化或扩展 Google Ads、Meta、LinkedIn、TikTok 等付费投放时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ad-copy-templates",
      source: new URL("./references/ad-copy-templates.md", import.meta.url),
      target: "references/ad-copy-templates.md",
      title: "ad-copy-templates.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "ad-creative",
      source: new URL("./references/ad-creative.md", import.meta.url),
      target: "references/ad-creative.md",
      title: "ad-creative.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "audience-targeting",
      source: new URL("./references/audience-targeting.md", import.meta.url),
      target: "references/audience-targeting.md",
      title: "audience-targeting.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "competitive-ads-extractor",
      source: new URL("./references/competitive-ads-extractor.md", import.meta.url),
      target: "references/competitive-ads-extractor.md",
      title: "competitive-ads-extractor.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "platform-setup-checklists",
      source: new URL("./references/platform-setup-checklists.md", import.meta.url),
      target: "references/platform-setup-checklists.md",
      title: "platform-setup-checklists.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for paid-ads.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
