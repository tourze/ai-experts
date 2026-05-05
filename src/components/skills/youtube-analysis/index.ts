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

export const youtubeAnalysisSkill = defineSkill({
  id: "youtube-analysis",
  fullName: "YouTube 视频分析",
  description: "当用户提供 YouTube 视频链接并要求分析内容、总结字幕、拆解演讲或提炼要点时使用。如果用户只是想搜视频而不是分析单个视频，改用 youtube-search。",
  useCases: [
    "用户给出单个 `youtube.com` / `youtu.be` 链接，希望你总结内容、提炼概念、输出讲义或会议笔记。",
    "用户明确提到“字幕”“转录”“tech talk 拆解”“podcast 摘要”“把这条 YouTube 视频看一遍”。",
    "用户先通过 [youtube-search](../youtube-search/SKILL.md) 找到候选视频，再对其中一条做深度分析。",
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
      id: "analyze-video",
      entry: new URL("./scripts/analyze_video.mjs", import.meta.url),
      target: "scripts/analyze_video.mjs",
      runtime: "node",
      bundle: false,
      description: "Script analyze_video.mjs.",
    }),
    defineSkillScript({
      id: "fetch-transcript",
      entry: new URL("./scripts/fetch_transcript.mjs", import.meta.url),
      target: "scripts/fetch_transcript.mjs",
      runtime: "node",
      bundle: false,
      description: "Script fetch_transcript.mjs.",
    }),
    defineSkillScript({
      id: "utils",
      entry: new URL("./scripts/utils.mjs", import.meta.url),
      target: "scripts/utils.mjs",
      runtime: "node",
      bundle: false,
      description: "Script utils.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "analysis-patterns",
      source: new URL("./references/analysis-patterns.md", import.meta.url),
      target: "references/analysis-patterns.md",
      title: "analysis-patterns.md",
      summary: "Reference material for youtube-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
  assets: [
    defineAsset({
      id: "output-template",
      source: new URL("./assets/output-template.md", import.meta.url),
      target: "assets/output-template.md",
    })
  ],
});
