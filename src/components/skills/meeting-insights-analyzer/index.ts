import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const meetingInsightsAnalyzerSkill = defineSkill({
  id: "meeting-insights-analyzer",
  fullName: "会议洞察分析",
  description: "当需要基于会议转写做沟通行为复盘、发言占比、打断频率、引导风格或跨会议趋势分析时使用。",
  useCases: [
    "用户希望复盘自己或团队在会议中的沟通方式，例如冲突回避、打断频率、引导风格、倾听质量或行动项清晰度。",
    "适合分析单场高信息量会议，或跨多场会议做趋势对比。",
    "典型输入为带说话人标识和时间戳的转写文本，也可以是录音导出的字幕文件。",
    "如果用户只想提取摘要、决策和行动项，使用 [references/meeting-minutes.md](references/meeting-minutes.md)。",
    "如果用户要正式纪要文档，而不是行为反馈，使用 [references/meeting-notes-and-actions.md](references/meeting-notes-and-actions.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "meeting-minutes",
      source: new URL("./references/meeting-minutes.md", import.meta.url),
      target: "references/meeting-minutes.md",
      title: "meeting-minutes.md",
      summary: "Reference material for meeting-insights-analyzer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "meeting-notes-and-actions",
      source: new URL("./references/meeting-notes-and-actions.md", import.meta.url),
      target: "references/meeting-notes-and-actions.md",
      title: "meeting-notes-and-actions.md",
      summary: "Reference material for meeting-insights-analyzer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
