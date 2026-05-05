import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { croMethodologySkill } from "../cro-methodology/index";

export const copywritingSkill = defineSkill({
  id: "copywriting",
  fullName: "营销页面文案（copywriting）",
  description: "当用户要撰写营销页面文案、价值主张、产品叙事、CTA、hero copy 或落地页段落时使用。",
  useCases: [
    "从零撰写首页、落地页、定价页、功能页、关于页或产品页的完整文案。",
    "改写已有页面文案，使其更清晰、更有说服力、转化率更高。",
    "为 A/B 测试产出多个文案变体。",
  ],
  constraints: [
    "先确认页面类型、目标受众、核心价值主张和期望行动（CTA），再动笔。",
    "文案基于用户真实语言，而非公司内部术语。",
    "每个页面只有一个主要 CTA；次要 CTA 不能与主 CTA 竞争注意力。",
    "转化率优化 → `cro-methodology`。",
  ],
  relatedSkills: [
    {
      get id() {
        return croMethodologySkill.id;
      },
      reason: "转化率优化 → `cro-methodology`。",
    },
  ],
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
      id: "content-filter",
      entry: new URL("./scripts/content_filter.mjs", import.meta.url),
      target: "scripts/content_filter.mjs",
      runtime: "node",
      bundle: false,
      description: "Script content_filter.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "content-filtering-guidelines",
      source: new URL("./references/content-filtering-guidelines.md", import.meta.url),
      target: "references/content-filtering-guidelines.md",
      title: "content-filtering-guidelines.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "copy-editing",
      source: new URL("./references/copy-editing.md", import.meta.url),
      target: "references/copy-editing.md",
      title: "copy-editing.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "influence-psychology",
      source: new URL("./references/influence-psychology.md", import.meta.url),
      target: "references/influence-psychology.md",
      title: "influence-psychology.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "made-to-stick",
      source: new URL("./references/made-to-stick.md", import.meta.url),
      target: "references/made-to-stick.md",
      title: "made-to-stick.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "marketing-psychology",
      source: new URL("./references/marketing-psychology.md", import.meta.url),
      target: "references/marketing-psychology.md",
      title: "marketing-psychology.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "page-type-guide",
      source: new URL("./references/page-type-guide.md", import.meta.url),
      target: "references/page-type-guide.md",
      title: "page-type-guide.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "safety-policies",
      source: new URL("./references/safety-policies.md", import.meta.url),
      target: "references/safety-policies.md",
      title: "safety-policies.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "social-platform-safety",
      source: new URL("./references/social-platform-safety.md", import.meta.url),
      target: "references/social-platform-safety.md",
      title: "social-platform-safety.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "usage-examples",
      source: new URL("./references/usage-examples.md", import.meta.url),
      target: "references/usage-examples.md",
      title: "usage-examples.md",
      summary: "Reference material for copywriting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
  assets: [
    defineAsset({
      id: "blocklist",
      source: new URL("./assets/blocklist.txt", import.meta.url),
      target: "assets/blocklist.txt",
    })
  ],
});
