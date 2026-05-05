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

export const copywritingSkill = defineSkill({
  id: "copywriting",
  fullName: "营销页面文案（copywriting）",
  description: "当用户要撰写营销页面文案、价值主张、产品叙事、CTA、hero copy 或落地页段落时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for copywriting.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "blocklist",
      source: new URL("./assets/blocklist.txt", import.meta.url),
      target: "assets/blocklist.txt",
    })
  ],
});
