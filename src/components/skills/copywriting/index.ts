import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
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
