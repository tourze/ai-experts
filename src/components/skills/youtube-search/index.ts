import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const youtubeSearchSkill = defineSkill({
  id: "youtube-search",
  fullName: "YouTube 视频搜索",
  description: "当用户要按关键词搜索 YouTube 视频、找教程、找热门视频或列候选清单时使用。如果用户已经给出单条视频链接并要总结内容，改用 youtube-analysis。",
  useCases: [
    "用户要“搜一下 YouTube 上有哪些视频”“找教程”“列几个候选视频”“看看这个主题最近有什么视频”。",
    "用户需要标题、频道、观看量、URL 这类结构化结果，方便后续筛选。",
    "用户先做发现，再把选中的单条视频交给 [youtube-analysis](../youtube-analysis/SKILL.md) 深挖。",
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
      id: "search-youtube",
      entry: new URL("./scripts/search_youtube.mjs", import.meta.url),
      target: "scripts/search_youtube.mjs",
      runtime: "node",
      bundle: false,
      description: "Script search_youtube.mjs.",
    })
  ],
});
