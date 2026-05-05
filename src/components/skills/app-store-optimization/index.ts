import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const appStoreOptimizationSkill = defineSkill({
  id: "app-store-optimization",
  description: "当用户要做 App Store / Google Play 的 ASO 优化、生成发布说明、版本更新文案或门店更新摘要时使用。",
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
      id: "collect-release-changes",
      entry: new URL("./scripts/collect_release_changes.mjs", import.meta.url),
      target: "scripts/collect_release_changes.mjs",
      runtime: "node",
      bundle: false,
      description: "Script collect_release_changes.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "changelog-guide",
      source: new URL("./references/changelog-guide.md", import.meta.url),
      target: "references/changelog-guide.md",
      title: "changelog-guide.md",
      summary: "Reference material for app-store-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "release-notes-guidelines",
      source: new URL("./references/release-notes-guidelines.md", import.meta.url),
      target: "references/release-notes-guidelines.md",
      title: "release-notes-guidelines.md",
      summary: "Reference material for app-store-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for app-store-optimization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
