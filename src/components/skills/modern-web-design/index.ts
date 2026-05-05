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
      id: "design-audit",
      entry: new URL("./scripts/design_audit.mjs", import.meta.url),
      target: "scripts/design_audit.mjs",
      runtime: "node",
      bundle: false,
      description: "Script design_audit.mjs.",
    }),
    defineSkillScript({
      id: "pattern-generator",
      entry: new URL("./scripts/pattern_generator.mjs", import.meta.url),
      target: "scripts/pattern_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script pattern_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "accessibility-guide",
      source: new URL("./references/accessibility_guide.md", import.meta.url),
      target: "references/accessibility_guide.md",
      title: "accessibility_guide.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "design-trends-2024",
      source: new URL("./references/design_trends_2024.md", import.meta.url),
      target: "references/design_trends_2024.md",
      title: "design_trends_2024.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "high-agency-protocol",
      source: new URL("./references/high-agency-protocol.md", import.meta.url),
      target: "references/high-agency-protocol.md",
      title: "high-agency-protocol.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "interaction-patterns",
      source: new URL("./references/interaction_patterns.md", import.meta.url),
      target: "references/interaction_patterns.md",
      title: "interaction_patterns.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "performance-checklist",
      source: new URL("./references/performance_checklist.md", import.meta.url),
      target: "references/performance_checklist.md",
      title: "performance_checklist.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-bold-raw",
      source: new URL("./references/styles-bold-raw.md", import.meta.url),
      target: "references/styles-bold-raw.md",
      title: "styles-bold-raw.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-catalog",
      source: new URL("./references/styles-catalog.md", import.meta.url),
      target: "references/styles-catalog.md",
      title: "styles-catalog.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-cultural-heritage",
      source: new URL("./references/styles-cultural-heritage.md", import.meta.url),
      target: "references/styles-cultural-heritage.md",
      title: "styles-cultural-heritage.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-depth-glass",
      source: new URL("./references/styles-depth-glass.md", import.meta.url),
      target: "references/styles-depth-glass.md",
      title: "styles-depth-glass.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-experimental-new",
      source: new URL("./references/styles-experimental-new.md", import.meta.url),
      target: "references/styles-experimental-new.md",
      title: "styles-experimental-new.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-futuristic",
      source: new URL("./references/styles-futuristic.md", import.meta.url),
      target: "references/styles-futuristic.md",
      title: "styles-futuristic.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-interactive",
      source: new URL("./references/styles-interactive.md", import.meta.url),
      target: "references/styles-interactive.md",
      title: "styles-interactive.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-minimal-flat",
      source: new URL("./references/styles-minimal-flat.md", import.meta.url),
      target: "references/styles-minimal-flat.md",
      title: "styles-minimal-flat.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-organic-natural",
      source: new URL("./references/styles-organic-natural.md", import.meta.url),
      target: "references/styles-organic-natural.md",
      title: "styles-organic-natural.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styles-retro-playful",
      source: new URL("./references/styles-retro-playful.md", import.meta.url),
      target: "references/styles-retro-playful.md",
      title: "styles-retro-playful.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "vdf-color-systems",
      source: new URL("./references/vdf-color-systems.md", import.meta.url),
      target: "references/vdf-color-systems.md",
      title: "vdf-color-systems.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "vdf-spacing-iconography",
      source: new URL("./references/vdf-spacing-iconography.md", import.meta.url),
      target: "references/vdf-spacing-iconography.md",
      title: "vdf-spacing-iconography.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "vdf-typography-systems",
      source: new URL("./references/vdf-typography-systems.md", import.meta.url),
      target: "references/vdf-typography-systems.md",
      title: "vdf-typography-systems.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "visual-brief-concretizer",
      source: new URL("./references/visual-brief-concretizer.md", import.meta.url),
      target: "references/visual-brief-concretizer.md",
      title: "visual-brief-concretizer.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "visual-design-foundations",
      source: new URL("./references/visual-design-foundations.md", import.meta.url),
      target: "references/visual-design-foundations.md",
      title: "visual-design-foundations.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "web-design-guidelines",
      source: new URL("./references/web-design-guidelines.md", import.meta.url),
      target: "references/web-design-guidelines.md",
      title: "web-design-guidelines.md",
      summary: "Reference material for modern-web-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
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
