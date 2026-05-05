import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const seoSkill = defineSkill({
  id: "seo",
  description: "当用户要提升搜索可见性、修复技术 SEO、优化元数据、结构化数据、索引策略或 Search Console 问题时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "aeo-geo",
      source: new URL("./references/aeo-geo.md", import.meta.url),
      target: "references/aeo-geo.md",
      title: "aeo-geo.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "programmatic-seo-playbooks",
      source: new URL("./references/programmatic-seo-playbooks.md", import.meta.url),
      target: "references/programmatic-seo-playbooks.md",
      title: "programmatic-seo-playbooks.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "site-architecture",
      source: new URL("./references/site-architecture.md", import.meta.url),
      target: "references/site-architecture.md",
      title: "site-architecture.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "site-type-checklists",
      source: new URL("./references/site-type-checklists.md", import.meta.url),
      target: "references/site-type-checklists.md",
      title: "site-type-checklists.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for seo.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
