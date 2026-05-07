import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, youtubeAnalysisAnalyzeVideo, youtubeAnalysisFetchTranscript } from "../../procedures/index";

import { youtubeSearchSkill } from "../youtube-search/index";

export const youtubeAnalysisSkill = defineSkill({
  id: "youtube-analysis",
  fullName: "YouTube 视频分析",
  description: "当用户提供 YouTube 视频链接并要求分析内容、总结字幕、拆解演讲或提炼要点时使用。如果用户只是想搜视频而不是分析单个视频，改用 youtube-search。",
  useCases: [
    "用户给出单个 `youtube.com` / `youtu.be` 链接，希望你总结内容、提炼概念、输出讲义或会议笔记。",
    "用户明确提到“字幕”“转录”“tech talk 拆解”“podcast 摘要”“把这条 YouTube 视频看一遍”。",
    "用户已找到候选视频，需要对其中一条做深度内容分析。",
  ],
  constraints: [
    "只基于字幕与元数据分析，不做画面、PPT、代码演示或肢体语言的臆测。",
    "通过 `yt-dlp` 提取字幕与元数据；脚本本身统一为 Node.js ESM。",
    "`youtube-analysis-analyze-video` procedure 生成的是“分析脚手架”，其中的 `[TO BE ANALYZED]` 是有意保留的占位符，不代表脚本缺失实现。",
    "没有字幕、视频私有、年龄限制或被地区封锁时，必须直接说明限制，不要伪造摘要。",
    "需要按视频类型调整提炼重点时，参考 `references/analysis-patterns.md`。",
  ],
  checklist: [
    "先确认输入是合法的 YouTube 链接或 11 位视频 ID。",
    "需要真实内容而不是占位稿时，优先读取 `youtube-analysis-fetch-transcript` procedure 的 JSON，再在上下文里完成分析。",
    "输出结论前确认 `source` 与 `language`，不要把自动字幕误写成官方字幕。",
    "如果视频明显依赖画面内容，结尾必须提示“仅基于字幕，视觉信息未覆盖”。",
    "生成 Markdown 文件时，确认最终交付是否仍保留 `[TO BE ANALYZED]`；只有用户明确要脚手架时才允许保留。",
  ],
  relatedSkills: [
    {
      get id() {
        return youtubeSearchSkill.id;
      },
      reason: "用户还没有具体视频链接，需要先搜索候选视频或比较多个视频时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无字幕硬总结",
      pass: "明确说明限制",
    }),
    defineAntiPattern({
      fail: "脚手架占位当答案：直接发给用户",
      pass: "完整填充",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认输入是合法 YouTube URL 或 11 位视频 ID；没有具体视频时转入搜索。",
      "调用 fetch-transcript procedure 获取字幕 JSON，检查 video_id、title、channel、duration、upload_date、language、source 和 transcript。",
      "没有字幕、私有、年龄限制或地区封锁时直接说明限制，不伪造摘要。",
      "需要脚手架文件时调用 analyze-video procedure；如果要真实内容，必须再基于 transcript 填充占位。",
      "深度分析按 transcript 时间戳分块，不从 dist 中 import procedure 源码。",
      "按 lecture、tutorial、interview、podcast、tech-talk 或 panel 选择分析重点，必要时读取 analysis-patterns。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "字幕获取结果：video_id、title、channel、duration_seconds、upload_date、language、source 和限制说明。",
      "按时间戳组织的摘要、主题结构、关键概念、论点、例子、行动项或讲义。",
      "分析脚手架或 Markdown 输出路径、是否仍含占位、仅基于字幕的覆盖限制和下一步补证建议。",
    ],
  }),
  procedures: [
    procedureUse(youtubeAnalysisAnalyzeVideo),
    procedureUse(youtubeAnalysisFetchTranscript),
  ],
  references: [
    defineReference({
      id: "analysis-patterns",
      source: new URL("./references/analysis-patterns.md", import.meta.url),
      target: "references/analysis-patterns.md",
      title: "analysis-patterns.md",
      summary: "按视频类型（Tech Talk、tutorial、podcast、会议演讲等）调整分析重点和提炼模式的方法。",
      loadWhen: "需要按视频类型调整提炼重点，或不确定当前视频应侧重哪些分析维度时读取。",
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
