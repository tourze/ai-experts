import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { copywritingSkill } from "../copywriting/index";
import { xiaohongshuCommercialGrowthSkill } from "../xiaohongshu-commercial-growth/index";

export const fanOperationsSkill = defineSkill({
  id: "fan-operations",
  fullName: "粉丝运营",
  description: "当用户要提升小红书粉丝互动、评论运营、私信承接、社群留存、粉丝分层或复购转化时使用。",
  useCases: [
    "需要回复评论、私信或设计忠粉维护动作。",
    "想从“发完就走”变成“持续互动”，提高粉丝粘性和复访率。",
    "需要围绕粉丝互动反推选题、内容节奏或社群活动。",
    "需要把公域粉丝进一步沉淀到私域时，读取 `private-domain` reference。",
    "需要统一品牌语气和人设时，读取 `personal-branding-advanced` reference。",
  ],
  constraints: [
    "先解决“回复是否及时”和“回复是否有信息量”，不要只追求高频复制粘贴。",
    "评论区和私信中的承诺必须真实可交付，不要为了互动率乱开口子。",
    "粉丝运营的目标是提高长期信任，不是短期刷互动。",
    "对外表达必须与账号定位一致；账号主张模糊时，先回到 `xiaohongshu-commercial-growth` 确认定位。",
    "涉及站外导流前，先检查平台安全边界，参考 `copywriting` 中的社交平台内容安全过滤流程。",
  ],
  checklist: [
    "评论回复先给结论，再给补充信息。",
    "回复内容中至少有一个“继续对话”的钩子问题。",
    "新粉欢迎语没有夸张承诺或站外导流冲动。",
    "已把高频问题沉淀成后续选题或 FAQ。",
  ],
  relatedSkills: [
    {
      get id() {
        return copywritingSkill.id;
      },
      reason: "涉及站外导流前，先检查平台安全边界，参考 `copywriting` 中的社交平台内容安全过滤流程。",
    },
    {
      get id() {
        return xiaohongshuCommercialGrowthSkill.id;
      },
      reason: "对外表达必须与账号定位一致；账号主张模糊时，先回到 `xiaohongshu-commercial-growth` 确认定位。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无信息回复",
      pass: "直接结论 + 钩子",
    }),
    defineAntiPattern({
      fail: "评论区甩链接",
      pass: "价值置顶",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认账号定位、粉丝类型、互动目标、高频问题、当前回复率、私信咨询和可交付承诺边界。",
      "评论回复先给直接结论，再补场景动作，并用一个钩子问题延续对话；不得用无信息回复刷互动。",
      "新粉欢迎语说明账号分享内容、适合解决的问题和主页置顶路径，不夸张承诺或冲动站外导流。",
      "每周复盘新增评论、回复率、私信咨询和反复被问到的话题，沉淀 FAQ、选题和下周互动实验。",
      "需要人设统一读取 personal-branding-advanced；公域转私域读取 private-domain；涉及安全导流联动 copywriting。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "评论回复、私信承接、新粉欢迎语、社群互动和复购维护建议。",
      "高频问题沉淀、FAQ/选题反哺、每周互动复盘和下周动作。",
      "品牌语气、人设一致性、私域边界和平台安全风险说明。",
    ],
  }),
  references: [
    defineReference({
      id: "personal-branding-advanced",
      source: new URL("./references/personal-branding-advanced.md", import.meta.url),
      target: "references/personal-branding-advanced.md",
      title: "personal-branding-advanced.md",
      summary: "小红书等社交平台个人品牌塑造与语气人设统一的高级策略。",
      loadWhen: "需要统一品牌语气和人设风格或提升粉丝互动中的品牌认知度时读取。",
    }),
    defineReference({
      id: "private-domain",
      source: new URL("./references/private-domain.md", import.meta.url),
      target: "references/private-domain.md",
      title: "private-domain.md",
      summary: "从公域粉丝沉淀到私域的运营策略、路径设计与安全边界。",
      loadWhen: "需要设计公域至私域的粉丝沉淀路径或规划私域承接方案时读取。",
    }),
  ],
});
