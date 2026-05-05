import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
      summary: "Reference material for ux-writing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
