import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { i18nLocalizationSkill } from "../i18n-localization/index";
import { modernWebDesignSkill } from "../modern-web-design/index";

export const uxWritingSkill = defineSkill({
  id: "ux-writing",
  fullName: "UX 微文案",
  description: "当用户要写或审按钮标签、错误消息、空态文案、表单 helper text、确认对话框、onboarding 提示或任何界面内微文案时使用。适合\"按钮写什么\"\"错误提示太生硬\"\"空态怎么写\"\"Submit 还是 Save\"等场景。",
  useCases: [
    "按钮标签（Submit / Save / Continue 还是具体动词）",
    "错误消息、空态、表单 helper、确认对话框",
    "Onboarding 首次提示、敏感操作措辞（删除/支付/注销）",
    "与 `product-design-critic` 联动评审文案。",
  ],
  constraints: [
    "**按钮动词化**：写按下之后发生什么。`Submit` → `Create account` / `Send invoice`。",
    "**错误三要素**：what + why + fix。不要只说 \"Invalid\"。",
    "**空态是教学机会**：解释这是什么 + 为什么空 + 下一步怎么办。",
    "**Placeholder 不是 label**：placeholder 在输入后消失，永远配真 label。",
    "**措辞承担后果**：`Delete forever` 比 `Remove` 诚实；扣费按钮要给金额和频率。",
    "**减字不减义**：每个词都要有工作。`Please click here to continue` → `Continue`。",
    "**大小写与标点一致**：全产品 Title Case 或 Sentence case 选一种。",
  ],
  relatedSkills: [
    {
      get id() {
        return i18nLocalizationSkill.id;
      },
      reason: "`i18n-localization`。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      label: "web-design-guidelines",
      reason: "`web-design-guidelines`",
    },
  ],
  checklist: [
    "按钮是动词 + 名词，不用 Submit/OK/Confirm。",
    "错误同时说 what / why / fix。",
    "空态给“这是什么 + 下一步 CTA”，不止 No results。",
    "Placeholder 和真 label 共存，不替代。",
    "敏感操作措辞反映真实后果。",
    "全产品大小写 / 标点 / 人称统一。",
    "i18n 友好：不字符串拼接，留 30% 膨胀空间。",
    "无 AI 腔（Please kindly / Effortlessly / thrilled to...）。",
    "配合 product-design-critic 的行业反模式。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "字符串拼接 / Placeholder 当 label",
      pass: "ICU + label + what-why-fix",
    }),
    defineAntiPattern({
      fail: "AI 客套话 / 硬译",
      pass: "直接 + 本地化重写",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "copy-patterns",
      source: new URL("./references/copy-patterns.md", import.meta.url),
      target: "references/copy-patterns.md",
      title: "copy-patterns.md",
      summary: "UX 微文案模式集合，包括按钮、错误消息、空态、表单 helper 和确认对话框的写法规范。",
      loadWhen: "需要参考具体文案范例来写或审按钮标签、错误提示或空态文案时读取。",
    }),
  ],
});
