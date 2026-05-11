import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { i18nLocalizationSkill } from "../i18n-localization/index";
import { modernWebDesignSkill } from "../modern-web-design/index";
import { productDesignCriticSkill } from "../product-design-critic/index";

export const uxWritingSkill = defineSkill({
  id: "ux-writing",
  fullName: "UX 微文案",
  description: "当用户要写或审按钮标签、错误消息、空态文案、表单 helper text、确认对话框、onboarding 提示或任何界面内微文案时使用。适合\"按钮写什么\"\"错误提示太生硬\"\"空态怎么写\"\"Submit 还是 Save\"等场景。",
  useCases: [
    "按钮标签（Submit / Save / Continue 还是具体动词）",
    "错误消息、空态、表单 helper、确认对话框",
    "Onboarding 首次提示、敏感操作措辞（删除/支付/注销）",
    "需要把微文案放回产品体验、关键任务和风险状态一起审查。",
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
      get skill() {
        return i18nLocalizationSkill;
      },
      reason: "微文案需要国际化、本地化重写、ICU 变量或字符串拼接审查时联动。",
    },
    {
      get skill() {
        return modernWebDesignSkill;
      },
      reason: "微文案问题和整体 Web 界面结构、视觉层级或交互设计一起审查时联动。",
    },
    {
      get skill() {
        return productDesignCriticSkill;
      },
      reason: "需要从产品任务、关键状态、信任损耗和 trade-off 角度审查文案时联动。",
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
    "配合产品体验评审检查行业反模式。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先盘出场景类型：按钮、错误、空态、helper、确认、toast、敬告、onboarding 或敏感操作。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按场景读取 copy-patterns 模板，明确用户当前状态、下一步动作、限制条件和真实后果。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "重写按钮为动词+名词；错误写 what/why/fix；空态说明这是什么、为什么空和下一步 CTA。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "统一声音：友好、专业、权威或技术只选一种；删掉 AI 腔、客套词和不承担后果的模糊动词。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "做 i18n 预审：不使用字符串拼接，变量可翻译，预留 30% 膨胀空间，placeholder 不替代 label。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按场景分组的原文问题、改写版本、采用的语气和具体改动理由。",
      "按钮、错误、空态、helper、确认对话框、Toast 或 onboarding 文案。",
      "i18n 风险、变量/ICU 建议、不可逆或扣费操作的后果提示和一致性检查。",
    ],
  }),
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
