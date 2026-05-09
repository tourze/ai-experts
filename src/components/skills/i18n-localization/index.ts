import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, i18nLocalizationI18nChecker } from "../../procedures/index";

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
    "需要静态检查时直接运行 `i18n-localization-i18n-checker` procedure。",
  ],
  checklist: [
    "所有用户可见文案都已脱离组件硬编码。",
    "locale 目录按语言和命名空间组织清晰。",
    "缺失翻译时有明确回退语言。",
    "日期、时间、数字、货币都使用地区化 API。",
    "RTL 页面已验证布局、图标方向和文本对齐。",
    "提交前已跑 `i18n-localization-i18n-checker` procedure 或等价 lint。",
  ],
  relatedSkills: [
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "多语言、长文案或 RTL 改动影响断点、换行和布局稳定性时联动。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      reason: "本地化影响整体页面视觉、内容层级或现代 Web 体验时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先盘点用户可见文案、目标语言/地区、命名空间、locale 目录和当前硬编码来源。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "把自然语言从组件逻辑迁移到语义翻译键；句子级翻译优先，不用字符串拼接造句。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "复数、日期、时间、数字和货币使用地区化 API 或 ICU 规则；缺失翻译必须有明确回退策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "RTL 场景检查布局、图标方向、滚动、动画、文本对齐和响应式溢出。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "上线前运行 i18n-localization-i18n-checker 或等价 lint，记录缺失键、硬编码和目录组织问题。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "翻译键、命名空间、locale 目录、缺失翻译和回退语言策略。",
      "硬编码文案迁移、句子级翻译、复数/日期/数字/货币格式化建议。",
      "RTL、响应式和视觉层级风险，以及 i18n checker 输出摘要。",
    ],
  }),
  procedures: [
    procedureUse(i18nLocalizationI18nChecker, {
      label: "扫描国际化问题",
      when: "需要检查项目中是否有硬编码文案或翻译文件键缺失。",
      reason: "自动扫描硬编码文案和缺失翻译键，避免未本地化的文案遗漏上线。",
    }),
  ],
});
