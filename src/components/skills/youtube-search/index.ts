import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const youtubeSearchSkill = defineSkill({
  id: "youtube-search",
  description: "当用户要按关键词搜索 YouTube 视频、找教程、找热门视频或列候选清单时使用。如果用户已经给出单条视频链接并要总结内容，改用 youtube-analysis。",
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
      id: "search-youtube",
      entry: new URL("./scripts/search_youtube.mjs", import.meta.url),
      target: "scripts/search_youtube.mjs",
      runtime: "node",
      bundle: false,
      description: "Script search_youtube.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for youtube-search.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
