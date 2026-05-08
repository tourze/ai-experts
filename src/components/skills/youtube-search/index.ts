import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, youtubeSearchSearchYoutube } from "../../procedures/index";

import { youtubeAnalysisSkill } from "../youtube-analysis/index";

export const youtubeSearchSkill = defineSkill({
  id: "youtube-search",
  fullName: "YouTube 视频搜索",
  description: "当用户要按关键词搜索 YouTube 视频、找教程、找热门视频或列候选清单时使用。如果用户已经给出单条视频链接并要总结内容，改用 youtube-analysis。",
  useCases: [
    "用户要“搜一下 YouTube 上有哪些视频”“找教程”“列几个候选视频”“看看这个主题最近有什么视频”。",
    "用户需要标题、频道、观看量、URL 这类结构化结果，方便后续筛选。",
    "用户还没有指定单条视频，需要先做候选发现和筛选。",
  ],
  constraints: [
    "默认使用 `yt-dlp ytsearch + --dump-single-json --flat-playlist`，字段是“尽力而为”。",
    "在 flat search 模式下，`upload_date`、`duration_string` 等字段可能为空；缺失时要明确说明，不要伪造。",
    "本技能不负责下载视频、不负责音视频转码，也不承诺绕过 YouTube 的反爬限制。",
    "当前目录已经提供 `youtube-search-search-youtube` procedure，优先用它，不要再依赖手写 `jq` 管道。",
    "用户已经给出明确视频链接且诉求是“总结内容”时，不要继续搜索，直接转入关联的视频分析 skill。",
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
      reason: "用户已经给出明确视频链接且诉求是“总结内容”时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先把查询词收窄到主题本身，不把分析诉求混进搜索词；已有单条视频链接且要总结时转 youtube-analysis。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "优先调用 youtube-search-search-youtube，使用 yt-dlp flat search 规范化字段。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "需要最近或热门时显式传 days 或 sort；不要靠自然语言脑补时间和排序。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "upload_date、duration_string 等字段可能为空，缺失时说明是 flat search 限制而不是脚本 bug。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "遇到 bot challenge 或反爬失败时直接说明失败原因，不把空结果伪装成没有搜到。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "查询词、排序/时间过滤参数、执行的 procedure 和失败原因。",
      "标准化视频字段：id、title、url、channel、view_count、duration_string、upload_date、description。",
      "字段缺失说明、候选筛选建议和需要 youtube-analysis 深挖的单条视频。",
    ],
  }),
  procedures: [
    procedureUse(youtubeSearchSearchYoutube),
  ],
});
