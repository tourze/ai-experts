import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";
import { interactionDesignSkill } from "../interaction-design/index";
import { responsiveDesignSkill } from "../responsive-design/index";
import { webPerformanceDiagnosisSkill } from "../web-performance-diagnosis/index";

export const modernWebDesignSkill = defineSkill({
  id: "modern-web-design",
  fullName: "现代 Web 设计",
  description: "当用户需要规划或实现现代 Web 界面、查询视觉风格、选择行业视觉方向、设计品牌化落地页或改进 Web UI 视觉表现时使用。",
  useCases: [
    "设计或重构品牌官网、产品页、营销页、活动页和高辨识度 Web App 界面。",
    "需要在\"好看\"和\"快\"之间做系统性平衡。",
    "用户说\"做成 X 风格\"但不确定 X 具体长什么样、CSS 怎么写。",
    "需要明确视觉方向，而不是套用通用模板。",
    "用户提到 \"premium\"、\"高级感\"、\"不要 AI 味\" 时，先读取 [references/high-agency-protocol.md](references/high-agency-protocol.md)。",
    "要给 AI 图像生成工具提供风格 prompt 关键词。",
    "与 `industry-design-presets` 联动：preset 选风格，本 skill 落地。",
  ],
  constraints: [
    "性能优先：任何视觉方案都不能明显伤害 LCP、INP、CLS。",
    "风格是一组约束，不是单个装饰特征。",
    "默认满足可访问性：对比度、键盘、焦点、动效降级不是后补项。",
    "不追热点式堆效果；玻璃、渐变、视差、滚动叙事都要有内容理由。",
    "避免\"AI 套版感\"：系统字体堆、紫色渐变、均匀卡片墙、无差别圆角、装饰性噪音。",
    "字体、色彩、网格、动效相互一致，围绕同一个概念服务。",
  ],
  checklist: [
    "界面有一句能说清的视觉方向定义。",
    "已查 styles-catalog.md 确认风格名称与实际特征匹配。",
    "过了 \"Do Not Use For\" 反适用清单。",
    "CSS 特征清单中的关键特征全部落地（不是只挑 1-2 个）。",
    "未混搭 > 2 种风格。",
    "字体、色彩、网格、动效相互一致。",
    "首屏优先级明确，核心 CTA 和核心叙事一眼可见。",
    "视觉亮点不会牺牲可读性、可达性和响应速度。",
    "动效数量克制，且有降级策略。",
  ],
  relatedSkills: [
    {
      get id() {
        return webPerformanceDiagnosisSkill.id;
      },
      reason: "`web-performance-diagnosis`、`interaction-design`、`responsive-design`。",
    },
    {
      get id() {
        return interactionDesignSkill.id;
      },
      reason: "`web-performance-diagnosis`、`interaction-design`、`responsive-design`。",
    },
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "`web-performance-diagnosis`、`interaction-design`、`responsive-design`。",
    },
    {
      get id() {
        return webPerformanceDiagnosisSkill.id;
      },
      label: "性能诊断",
      reason: "已通过 `性能诊断` 复核。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "AI 套版感",
      pass: "有方向的视觉",
    }),
    defineAntiPattern({
      fail: "三风格混搭",
      pass: "一页一风格：全局 Bento + 微 Glass 强调，不混入 Neumorphism / Brutalism / Cyberpunk。",
    }),
    defineAntiPattern({
      fail: "重型视觉无预算：LCP 1.5s → 6s，移动端卡死。",
      pass: "配性能预算：预算 LCP < 2.5s，JS < 300KB。hero 用渐变+静态图，滚动动效用 IntersectionObserver + CSS。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("modern-web-design-design-audit"),
    scriptUse("modern-web-design-pattern-generator"),
  ],
  references: [
    defineReference({
      id: "accessibility-guide",
      source: new URL("./references/accessibility_guide.md", import.meta.url),
      target: "references/accessibility_guide.md",
      title: "accessibility_guide.md",
      summary: "Web 可访问性的设计规范与实现指南，涵盖对比度、键盘导航、焦点管理和动效降级。",
      loadWhen: "需要确保设计方案满足无障碍标准或检查对比度、键盘导航等要素时读取。",
    }),
    defineReference({
      id: "design-trends-2024",
      source: new URL("./references/design_trends_2024.md", import.meta.url),
      target: "references/design_trends_2024.md",
      title: "design_trends_2024.md",
      summary: "2024 年 Web 设计趋势汇总，包括主流视觉风格和行业方向。",
      loadWhen: "需要了解当前设计趋势或为项目选择视觉方向时读取。",
    }),
    defineReference({
      id: "high-agency-protocol",
      source: new URL("./references/high-agency-protocol.md", import.meta.url),
      target: "references/high-agency-protocol.md",
      title: "high-agency-protocol.md",
      summary: "避免 AI 套版感的设计原则，打造有差异化和高级感的 Web 界面。",
      loadWhen: "用户提到 premium、高级感或不要 AI 味，需要明确视觉差异化方向时读取。",
    }),
    defineReference({
      id: "interaction-patterns",
      source: new URL("./references/interaction_patterns.md", import.meta.url),
      target: "references/interaction_patterns.md",
      title: "interaction_patterns.md",
      summary: "Web 交互模式的分类与设计指南，涵盖微交互动效、滚动叙事和用户反馈机制。",
      loadWhen: "需要设计页面交互动效、滚动叙事或用户交互反馈时读取。",
    }),
    defineReference({
      id: "performance-checklist",
      source: new URL("./references/performance_checklist.md", import.meta.url),
      target: "references/performance_checklist.md",
      title: "performance_checklist.md",
      summary: "Web 设计阶段的性能检查清单，包括 LCP、INP、CLS 优化和资源加载策略。",
      loadWhen: "需要平衡视觉效果与加载性能，或评估设计方案对性能指标的影响时读取。",
    }),
    defineReference({
      id: "styles-bold-raw",
      source: new URL("./references/styles-bold-raw.md", import.meta.url),
      target: "references/styles-bold-raw.md",
      title: "styles-bold-raw.md",
      summary: "Bold/Raw 风格的视觉特征定义、适用场景和 CSS 实现要点。",
      loadWhen: "需要实现粗犷、原始、工业风的视觉风格时读取。",
    }),
    defineReference({
      id: "styles-catalog",
      source: new URL("./references/styles-catalog.md", import.meta.url),
      target: "references/styles-catalog.md",
      title: "styles-catalog.md",
      summary: "Web 设计风格的全面目录与特征对照，帮助匹配风格名称与实际视觉特征。",
      loadWhen: "需要确认风格名称对应的实际特征或为项目选择合适的视觉风格时读取。",
    }),
    defineReference({
      id: "styles-cultural-heritage",
      source: new URL("./references/styles-cultural-heritage.md", import.meta.url),
      target: "references/styles-cultural-heritage.md",
      title: "styles-cultural-heritage.md",
      summary: "文化传承风格的设计定义、视觉元素和适用场景。",
      loadWhen: "需要结合传统文化元素进行设计时读取。",
    }),
    defineReference({
      id: "styles-depth-glass",
      source: new URL("./references/styles-depth-glass.md", import.meta.url),
      target: "references/styles-depth-glass.md",
      title: "styles-depth-glass.md",
      summary: "深度玻璃拟态风格的视觉特征、层级表现和 CSS 实现方法。",
      loadWhen: "需要实现玻璃拟态或深度层级玻璃效果时读取。",
    }),
    defineReference({
      id: "styles-experimental-new",
      source: new URL("./references/styles-experimental-new.md", import.meta.url),
      target: "references/styles-experimental-new.md",
      title: "styles-experimental-new.md",
      summary: "实验性/新锐风格的视觉定义与前沿设计实践。",
      loadWhen: "需要探索前卫、实验性的视觉风格时读取。",
    }),
    defineReference({
      id: "styles-futuristic",
      source: new URL("./references/styles-futuristic.md", import.meta.url),
      target: "references/styles-futuristic.md",
      title: "styles-futuristic.md",
      summary: "未来主义风格的视觉特征、典型元素和实现指南。",
      loadWhen: "需要实现科技感、未来主义的视觉风格时读取。",
    }),
    defineReference({
      id: "styles-interactive",
      source: new URL("./references/styles-interactive.md", import.meta.url),
      target: "references/styles-interactive.md",
      title: "styles-interactive.md",
      summary: "高交互度风格的视觉特征和动效设计原则。",
      loadWhen: "需要以交互反馈为核心驱动视觉风格时读取。",
    }),
    defineReference({
      id: "styles-minimal-flat",
      source: new URL("./references/styles-minimal-flat.md", import.meta.url),
      target: "references/styles-minimal-flat.md",
      title: "styles-minimal-flat.md",
      summary: "极简/扁平风格的视觉特征、设计约束和典型实现方式。",
      loadWhen: "需要实现简洁、扁平化的视觉风格时读取。",
    }),
    defineReference({
      id: "styles-organic-natural",
      source: new URL("./references/styles-organic-natural.md", import.meta.url),
      target: "references/styles-organic-natural.md",
      title: "styles-organic-natural.md",
      summary: "有机自然风格的视觉特征、材质表现和实现方法。",
      loadWhen: "需要营造自然、有机、温暖的视觉氛围时读取。",
    }),
    defineReference({
      id: "styles-retro-playful",
      source: new URL("./references/styles-retro-playful.md", import.meta.url),
      target: "references/styles-retro-playful.md",
      title: "styles-retro-playful.md",
      summary: "复古/趣味风格的视觉特征与设计实现要点。",
      loadWhen: "需要实现复古、趣味性或怀旧风格的界面时读取。",
    }),
    defineReference({
      id: "vdf-color-systems",
      source: new URL("./references/vdf-color-systems.md", import.meta.url),
      target: "references/vdf-color-systems.md",
      title: "vdf-color-systems.md",
      summary: "VDF 设计体系的色彩系统规范，包括色板、角色定义和使用指南。",
      loadWhen: "需要定义或应用 VDF 设计体系的色彩方案时读取。",
    }),
    defineReference({
      id: "vdf-spacing-iconography",
      source: new URL("./references/vdf-spacing-iconography.md", import.meta.url),
      target: "references/vdf-spacing-iconography.md",
      title: "vdf-spacing-iconography.md",
      summary: "VDF 设计体系的空间网格和图标系统规范。",
      loadWhen: "需要遵循 VDF 间距规范或设计图标体系时读取。",
    }),
    defineReference({
      id: "vdf-typography-systems",
      source: new URL("./references/vdf-typography-systems.md", import.meta.url),
      target: "references/vdf-typography-systems.md",
      title: "vdf-typography-systems.md",
      summary: "VDF 设计体系的字体排版规范，包括字族、字号、行高和层级定义。",
      loadWhen: "需要应用 VDF 排版体系或定义文字层级时读取。",
    }),
    defineReference({
      id: "visual-brief-concretizer",
      source: new URL("./references/visual-brief-concretizer.md", import.meta.url),
      target: "references/visual-brief-concretizer.md",
      title: "visual-brief-concretizer.md",
      summary: "视觉需求从抽象 Brief 到具体设计方案的转化方法和流程。",
      loadWhen: "需要将模糊的视觉需求转化为具体可执行的设计方向时读取。",
    }),
    defineReference({
      id: "visual-design-foundations",
      source: new URL("./references/visual-design-foundations.md", import.meta.url),
      target: "references/visual-design-foundations.md",
      title: "visual-design-foundations.md",
      summary: "视觉设计基础知识，包括色彩理论、排版原则、布局规则和视觉层次。",
      loadWhen: "需要回顾视觉设计基础原理或检查设计稿的视觉一致性时读取。",
    }),
    defineReference({
      id: "web-design-guidelines",
      source: new URL("./references/web-design-guidelines.md", import.meta.url),
      target: "references/web-design-guidelines.md",
      title: "web-design-guidelines.md",
      summary: "Web 设计的通用指南和最佳实践汇总。",
      loadWhen: "需要查阅 Web 设计通用规范或最佳实践清单时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "readme",
      source: new URL("./assets/README.md", import.meta.url),
      target: "assets/README.md",
    })
  ],
});
