import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  constraints: [
    "任何行为判断都必须带证据：至少提供会议名称、时间点或原句片段，先给观察，再给解释。",
    "当转写缺少说话人标签、时间戳或用户身份映射时，必须先声明分析边界，不能伪造“精确指标”。",
    "输出必须区分三层：`观察到什么`、`这意味着什么`、`建议如何改`，不能把推断伪装成事实。",
    "不做人格诊断、心理诊断或情绪臆测；没有文本证据时，不能下“你焦虑/你愤怒/你不尊重别人”这种结论。",
    "趋势对比必须说明样本范围、会议数量和时间窗；跨会议标签不一致时要加显式风险提示。",
  ],
  checklist: [
    "已先确认分析对象是谁，并建立转写中的说话人映射。",
    "已声明样本范围、会议数量、时间窗与数据缺口，不提供无依据的精确数字。",
    "每条模式结论都至少给出 1 条原文证据；重要结论优先给 2-3 条强证据。",
    "输出同时包含优势、风险和下一步改进动作，不只列缺点。",
    "建议部分给出可直接复用的替代表达或会议动作，而不是空泛鸡汤。",
    "当用户真正要的是摘要或纪要时，已切回会议纪要相关工具。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无映射伪精确",
      pass: "先声明边界",
    }),
    defineAntiPattern({
      fail: "空泛鸡汤建议",
      pass: "证据 + 替代表达",
    }),
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
      summary: "会议纪要的标准模板与撰写方法，用于提取摘要、决策和行动项。",
      loadWhen: "用户只想提取会议摘要、决策和行动项，而非行为分析时读取。",
    }),
    defineReference({
      id: "meeting-notes-and-actions",
      source: new URL("./references/meeting-notes-and-actions.md", import.meta.url),
      target: "references/meeting-notes-and-actions.md",
      title: "meeting-notes-and-actions.md",
      summary: "正式会议纪要与待办记录的撰写规范，适用于输出正式文档的场景。",
      loadWhen: "需要输出正式会议纪要文档，而非行为反馈分析时读取。",
    }),
  ],
});
