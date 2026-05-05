import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

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
      id: "i18n-checker",
      entry: new URL("./scripts/i18n_checker.mjs", import.meta.url),
      target: "scripts/i18n_checker.mjs",
      runtime: "node",
      bundle: false,
      description: "Script i18n_checker.mjs.",
    })
  ],
});
