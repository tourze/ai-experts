import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { youtubeAnalysisSkill } from "../youtube-analysis/index";

export const youtubeSearchSkill = defineSkill({
  id: "youtube-search",
  fullName: "YouTube 视频搜索",
  description: "当用户要按关键词搜索 YouTube 视频、找教程、找热门视频或列候选清单时使用。如果用户已经给出单条视频链接并要总结内容，改用 youtube-analysis。",
  useCases: [
    "用户要“搜一下 YouTube 上有哪些视频”“找教程”“列几个候选视频”“看看这个主题最近有什么视频”。",
    "用户需要标题、频道、观看量、URL 这类结构化结果，方便后续筛选。",
    "用户先做发现，再把选中的单条视频交给 `youtube-analysis` 深挖。",
  ],
  constraints: [
    "默认使用 `yt-dlp ytsearch + --dump-single-json --flat-playlist`，字段是“尽力而为”。",
    "在 flat search 模式下，`upload_date`、`duration_string` 等字段可能为空；缺失时要明确说明，不要伪造。",
    "本技能不负责下载视频、不负责音视频转码，也不承诺绕过 YouTube 的反爬限制。",
    "当前目录已经提供 `scripts/search_youtube.mjs`，优先用它，不要再依赖手写 `jq` 管道。",
    "用户已经给出明确视频链接且诉求是“总结内容”时，不要继续搜索，直接切到 `youtube-analysis`。",
  ],
  checklist: [
    "查询词先收窄到主题本身，不要把分析诉求和搜索词混在一起。",
    "需要“最近”或“热门”时，显式指定 `--days` 或 `--sort`，不要靠自然语言脑补。",
    "如果 `upload_date` / `duration_string` 为空，要告诉用户这是 YouTube flat search 的字段缺失，不是脚本 bug。",
    "YouTube 触发 bot challenge 时，直接说明失败原因；不要把空结果伪装成“没有搜到”。",
  ],
  relatedSkills: [
    {
      get id() {
        return youtubeAnalysisSkill.id;
      },
      reason: "用户已经给出明确视频链接且诉求是“总结内容”时，不要继续搜索，直接切到 `youtube-analysis`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "当下载器使",
      pass: "明确职责边界",
    }),
    defineAntiPattern({
      fail: "flat 字段当真实数据",
      pass: "缺失字段显式说明",
    }),
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
      entry: new URL("./scripts/search_youtube.ts", import.meta.url),
      target: "scripts/search_youtube.mjs",
      runtime: "node",
      bundle: false,
      description: "Script search_youtube.mjs.",
    })
  ],
});
