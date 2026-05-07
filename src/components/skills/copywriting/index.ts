import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, copywritingContentFilter } from "../../procedures/index";

import { croMethodologySkill } from "../cro-methodology/index";

export const copywritingSkill = defineSkill({
  id: "copywriting",
  fullName: "营销页面文案（copywriting）",
  description: "当用户要撰写营销页面文案、价值主张、产品叙事、CTA、hero copy 或落地页段落时使用。",
  useCases: [
    "从零撰写首页、落地页、定价页、功能页、关于页或产品页的完整文案。",
    "改写已有页面文案，使其更清晰、更有说服力、转化率更高。",
    "为 A/B 测试产出多个文案变体。",
  ],
  constraints: [
    "先确认页面类型、目标受众、核心价值主张和期望行动（CTA），再动笔。",
    "文案基于用户真实语言，而非公司内部术语。",
    "每个页面只有一个主要 CTA；次要 CTA 不能与主 CTA 竞争注意力。",
    "转化率优化 → `cro-methodology`。",
  ],
  checklist: [
    "明确了页面类型、受众和核心价值主张",
    "Headline 5 秒内传达\"这是什么 + 跟我有什么关系\"",
    "Benefits 驱动，非 features 驱动",
    "CTA 明确告知点击后获得什么",
    "有 social proof 支撑核心声明",
    "使用客户语言而非公司术语",
    "有 objection handling",
    "指定了 voice & tone",
  ],
  relatedSkills: [
    {
      get id() {
        return croMethodologySkill.id;
      },
      reason: "转化率优化 → `cro-methodology`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Feature-first headline",
      pass: "Benefit-first headline",
    }),
    defineAntiPattern({
      fail: "Company-speak",
      pass: "Customer language",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为首页、落地页、定价页、功能页、关于页和产品页写出清晰、具体、可信、以客户语言驱动转化的营销文案。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认页面类型、目标受众、核心价值主张、主要 CTA、证明材料、反对意见和 voice & tone。",
      "写作优先级是 Clarity、Benefits、Specificity、Customer language；风格保持 simple、specific、active、confident、honest。",
      "页面结构按首屏、社会证明、痛点、解决方案/收益、How it works、FAQ/异议处理、最终 CTA 组合；不同页面读取 page-type-guide。",
      "CTA 使用 action verb + what they get + qualifier，按钮控制在 5 词内，必要时加低风险说明。",
      "引用社交平台素材或投放文案前读取 social-platform-safety，并可调用 copywriting-content-filter 做安全过滤。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "页面文案：headline、subheadline、CTA、social proof、主体区块、FAQ/异议处理和最终 CTA。",
      "A/B 文案变体、voice & tone、客户语言替换、利益点排序和证明材料缺口。",
      "内容安全检查结果、敏感内容过滤说明和需要 CRO 联动的实验假设。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(copywritingContentFilter),
  ],
  references: [
    defineReference({
      id: "content-filtering-guidelines",
      source: new URL("./references/content-filtering-guidelines.md", import.meta.url),
      target: "references/content-filtering-guidelines.md",
      title: "content-filtering-guidelines.md",
      summary: "内容过滤指南：敏感词检测、品牌合规与风格一致性检查。",
      loadWhen: "需要过滤文案中的敏感内容或检查品牌合规时读取。",
    }),
    defineReference({
      id: "copy-editing",
      source: new URL("./references/copy-editing.md", import.meta.url),
      target: "references/copy-editing.md",
      title: "copy-editing.md",
      summary: "文案编辑指南：语法、标点、语气调优与一致性检查规则。",
      loadWhen: "需要润色已有文案或统一多页文案风格时读取。",
    }),
    defineReference({
      id: "influence-psychology",
      source: new URL("./references/influence-psychology.md", import.meta.url),
      target: "references/influence-psychology.md",
      title: "influence-psychology.md",
      summary: "影响力心理学原理在营销文案中的应用：互惠、稀缺、社会认同等。",
      loadWhen: "需要运用心理说服原则增强文案说服力时读取。",
    }),
    defineReference({
      id: "made-to-stick",
      source: new URL("./references/made-to-stick.md", import.meta.url),
      target: "references/made-to-stick.md",
      title: "made-to-stick.md",
      summary: "《让创意更有黏性》SUCCES 原则在文案与产品叙事中的应用。",
      loadWhen: "需要设计令人印象深刻的品牌叙事或价值主张时读取。",
    }),
    defineReference({
      id: "marketing-psychology",
      source: new URL("./references/marketing-psychology.md", import.meta.url),
      target: "references/marketing-psychology.md",
      title: "marketing-psychology.md",
      summary: "营销心理学原理全面综述：认知偏差、决策驱动与行为触发机制。",
      loadWhen: "需要综合运用心理策略设计转化型文案时读取。",
    }),
    defineReference({
      id: "page-type-guide",
      source: new URL("./references/page-type-guide.md", import.meta.url),
      target: "references/page-type-guide.md",
      title: "page-type-guide.md",
      summary: "各页面类型文案写作指南：首页、落地页、定价页、功能页等差异化策略。",
      loadWhen: "需要根据不同页面类型调整文案结构或写作策略时读取。",
    }),
    defineReference({
      id: "safety-policies",
      source: new URL("./references/safety-policies.md", import.meta.url),
      target: "references/safety-policies.md",
      title: "safety-policies.md",
      summary: "文案安全政策：禁止内容、合规声明与法律风险规避。",
      loadWhen: "需要确保文案不违反平台安全政策或合规要求时读取。",
    }),
    defineReference({
      id: "social-platform-safety",
      source: new URL("./references/social-platform-safety.md", import.meta.url),
      target: "references/social-platform-safety.md",
      title: "social-platform-safety.md",
      summary: "社交媒体平台安全规范：各平台广告审核政策与内容限制。",
      loadWhen: "需要确保社交平台投放文案符合平台广告审核政策时读取。",
    }),
    defineReference({
      id: "usage-examples",
      source: new URL("./references/usage-examples.md", import.meta.url),
      target: "references/usage-examples.md",
      title: "usage-examples.md",
      summary: "文案编写实际用例：各类页面的完整文案示例与优劣对比。",
      loadWhen: "需要参考实际文案示例来指导写作方向时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "blocklist",
      source: new URL("./assets/blocklist.txt", import.meta.url),
      target: "assets/blocklist.txt",
    })
  ],
});
