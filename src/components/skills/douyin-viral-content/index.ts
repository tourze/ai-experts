import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const douyinViralContentSkill = defineSkill({
  id: "douyin-viral-content",
  description: "当用户要创作或优化抖音短视频选题、爆款标题、口播脚本、开头钩子、分镜节奏或带货文案时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "douyin-video-summary",
      source: new URL("./references/douyin-video-summary.md", import.meta.url),
      target: "references/douyin-video-summary.md",
      title: "douyin-video-summary.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "estimation-model",
      source: new URL("./references/estimation-model.md", import.meta.url),
      target: "references/estimation-model.md",
      title: "estimation-model.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "learning-guide",
      source: new URL("./references/learning-guide.md", import.meta.url),
      target: "references/learning-guide.md",
      title: "learning-guide.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "optimization-guide",
      source: new URL("./references/optimization-guide.md", import.meta.url),
      target: "references/optimization-guide.md",
      title: "optimization-guide.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scoring-system",
      source: new URL("./references/scoring-system.md", import.meta.url),
      target: "references/scoring-system.md",
      title: "scoring-system.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "viral-factors",
      source: new URL("./references/viral-factors.md", import.meta.url),
      target: "references/viral-factors.md",
      title: "viral-factors.md",
      summary: "Reference material for douyin-viral-content.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for douyin-viral-content.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
