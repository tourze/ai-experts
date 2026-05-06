import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";
import { modernWebDesignSkill } from "../modern-web-design/index";
import { responsiveDesignSkill } from "../responsive-design/index";

export const i18nLocalizationSkill = defineSkill({
  id: "i18n-localization",
  fullName: "国际化与本地化",
  description: "当需要实现多语言、排查硬编码文案、管理翻译资源、设计 locale 结构或处理 RTL 与日期数字格式时使用。",
  useCases: [
    "应用需要支持多语言、多地区或右到左布局。",
    "需要从硬编码文案迁移到翻译键。",
    "需要梳理 locale 目录、命名空间和翻译补全流程。",
    "需要检查日期、货币、数字和复数规则是否按地区展示。",
  ],
  constraints: [
    "文案必须用键，不要把自然语言直接写进组件逻辑。",
    "句子级翻译优先于字符串拼接；拼接会破坏语序、复数和性别变化。",
    "locale 文件按功能域拆分，不要把全部文案塞进一个大 JSON。",
    "RTL 不是“文字反过来”这么简单，布局、图标方向、滚动与动画都要核查。",
    "国际化上线前必须验证回退语言和缺失翻译策略。",
    "需要静态检查时直接运行 `scripts/i18n_checker.mjs`。",
  ],
  checklist: [
    "所有用户可见文案都已脱离组件硬编码。",
    "locale 目录按语言和命名空间组织清晰。",
    "缺失翻译时有明确回退语言。",
    "日期、时间、数字、货币都使用地区化 API。",
    "RTL 页面已验证布局、图标方向和文本对齐。",
    "提交前已跑 `scripts/i18n_checker.mjs` 或等价 lint。",
  ],
  relatedSkills: [
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "`responsive-design`。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      label: "web-design-guidelines",
      reason: "`web-design-guidelines`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "字符串拼接造句",
      pass: "句子级 + ICU plural",
    }),
    defineAntiPattern({
      fail: "业务键是语言文案",
      pass: "语义键",
    }),
    defineAntiPattern({
      fail: "只翻默认页面",
      pass: "全覆盖翻译矩阵",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("i18n-localization-i18n-checker"),
  ],
});
