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
  fullName: "App Store ASO 优化",
  description: "当用户要做 App Store / Google Play 的 ASO 优化、生成发布说明、版本更新文案或门店更新摘要时使用。",
  useCases: [
    "需要评估关键词、标题、副标题、描述和关键词字段。",
    "需要分析竞品、评论趋势、评分结构和增长优先级。",
    "需要设计素材或元数据 A/B 测试方案。",
    "需要规划多语言本地化、发版节奏和上线检查清单。",
    "需要从最近一个 tag 到当前版本提炼 App Store「新内容」文案。",
    "需要把技术提交整理成用户能看懂的发布摘要。",
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
  ],
});
