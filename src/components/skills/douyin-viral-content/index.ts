import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const douyinViralContentSkill = defineSkill({
  id: "douyin-viral-content",
  fullName: "抖音爆款文案生成",
  description: "当用户要创作或优化抖音短视频选题、爆款标题、口播脚本、开头钩子、分镜节奏或带货文案时使用。",
  useCases: [
    "用户只有一句金句、一本书摘录或一段主题素材，需要产出可发布的抖音文案。",
    "用户已经有历史文案样本，希望总结哪些表达更容易带来完播、互动和转发。",
    "用户提供视频摘要或逐字稿，需要二次改写成更适合短视频的口播文本。",
    "需要先提取视频内容时，使用本 skill 的视频摘要功能。",
  ],
  constraints: [
    "不要承诺“必定 5 星”或“保证爆款”；评分只能作为内部比较，不是结果保证。",
    "只有在用户明确提供历史样本、目录或表现数据时，才做校准；否则使用通用基线并明确说明。",
    "不要虚构播放量、完播率、账号体量和历史数据。",
    "输出必须保留平台安全边界，不给违规导流、虚假收益或极端承诺。",
    "当素材本身信息不足时，优先补问题，不要硬凑长文案。",
  ],
  checklist: [
    "已说明是否存在“历史样本校准”。",
    "口播脚本开头 1-2 句具备明确钩子，不绕弯。",
    "标签数量控制在 4-6 个，不堆砌。",
    "评分理由与文案结构一一对应，而不是只报分不解释。",
    "如果使用了历史数据，已标明是基于用户给定样本的归纳。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "空洞词汇堆砌",
      pass: "画面 + 情绪 + 动作",
    }),
    defineAntiPattern({
      fail: "假承诺播放量",
      pass: "显式说明评分仅供比较",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断是否有历史文案目录、表现数据、视频摘要或逐字稿；没有校准样本时使用通用基线并显式说明。",
      "创作输出先定 20 字内钩子标题，再写 3-6 段口播，单段不超过 40 字，标签控制在 4-6 个。",
      "评分和优化只引用 viral-factors、scoring-system、estimation-model、optimization-guide 和 learning-guide，不承诺播放量或爆款结果。",
      "需要从视频提取内容时读取 douyin-video-summary；素材信息不足时先补问题，不硬凑长文案。",
      "所有输出保留平台安全边界，避免违规导流、虚假收益、极端承诺和伪造历史数据。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "标题、口播文案、推荐标签、分镜/节奏建议和互动动作。",
      "复盘说明：核心钩子、情绪方向、适配人群、评分理由和优化建议。",
      "历史样本校准状态、使用的参考资料、平台安全风险和需要补充的素材缺口。",
    ],
  }),
  references: [
    defineReference({
      id: "douyin-video-summary",
      source: new URL("./references/douyin-video-summary.md", import.meta.url),
      target: "references/douyin-video-summary.md",
      title: "douyin-video-summary.md",
      summary: "从抖音视频中提取逐字稿并生成结构化摘要的方法与提示词。",
      loadWhen: "需要从视频内容中提取素材用于文案二次创作或分析时读取。",
    }),
    defineReference({
      id: "estimation-model",
      source: new URL("./references/estimation-model.md", import.meta.url),
      target: "references/estimation-model.md",
      title: "estimation-model.md",
      summary: "抖音文案效果的预估模型，用于评估爆款潜力和互动预期。",
      loadWhen: "需要评估文案的爆款潜力或预估播放/互动效果时读取。",
    }),
    defineReference({
      id: "learning-guide",
      source: new URL("./references/learning-guide.md", import.meta.url),
      target: "references/learning-guide.md",
      title: "learning-guide.md",
      summary: "抖音短视频创作的系统学习路径和关键技巧总结。",
      loadWhen: "需要系统提升抖音文案创作能力或了解平台运营方法论时读取。",
    }),
    defineReference({
      id: "optimization-guide",
      source: new URL("./references/optimization-guide.md", import.meta.url),
      target: "references/optimization-guide.md",
      title: "optimization-guide.md",
      summary: "抖音文案的逐项优化方法，包括开头钩子、节奏控制、完播率提升。",
      loadWhen: "需要对已有文案进行针对性优化以提升完播率和互动率时读取。",
    }),
    defineReference({
      id: "scoring-system",
      source: new URL("./references/scoring-system.md", import.meta.url),
      target: "references/scoring-system.md",
      title: "scoring-system.md",
      summary: "抖音文案的内部评分指标体系与评分规则说明。",
      loadWhen: "需要对新创作的文案进行评分或对照评分维度自查时读取。",
    }),
    defineReference({
      id: "viral-factors",
      source: new URL("./references/viral-factors.md", import.meta.url),
      target: "references/viral-factors.md",
      title: "viral-factors.md",
      summary: "抖音爆款视频的关键影响因素分析，包括完播、互动、转发各维度的驱动因子。",
      loadWhen: "需要理解什么因素驱动视频爆款或分析爆款案例时读取。",
    }),
  ],
});
