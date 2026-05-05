import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const xiaohongshuCommercialGrowthSkill = defineSkill({
  id: "xiaohongshu-commercial-growth",
  description: "当用户要制定小红书商业增长、店铺转化、蒲公英投放、种草链路、私域承接或变现方案时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "checklists",
      source: new URL("./references/checklists.md", import.meta.url),
      target: "references/checklists.md",
      title: "checklists.md",
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "playbook",
      source: new URL("./references/playbook.md", import.meta.url),
      target: "references/playbook.md",
      title: "playbook.md",
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "xhs-graphic-generator",
      source: new URL("./references/xhs-graphic-generator.md", import.meta.url),
      target: "references/xhs-graphic-generator.md",
      title: "xhs-graphic-generator.md",
      summary: "Reference material for xiaohongshu-commercial-growth.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for xiaohongshu-commercial-growth.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
