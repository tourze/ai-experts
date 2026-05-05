import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fanOperationsSkill = defineSkill({
  id: "fan-operations",
  fullName: "粉丝运营",
  description: "当用户要提升小红书粉丝互动、评论运营、私信承接、社群留存、粉丝分层或复购转化时使用。",
  useCases: [
    "需要回复评论、私信或设计忠粉维护动作。",
    "想从“发完就走”变成“持续互动”，提高粉丝粘性和复访率。",
    "需要围绕粉丝互动反推选题、内容节奏或社群活动。",
    "需要把公域粉丝进一步沉淀到私域时，参考 [references/private-domain.md](references/private-domain.md)。",
    "需要统一品牌语气和人设时，参考 [references/personal-branding-advanced.md](references/personal-branding-advanced.md)。",
  ],
  constraints: [
    "先解决“回复是否及时”和“回复是否有信息量”，不要只追求高频复制粘贴。",
    "评论区和私信中的承诺必须真实可交付，不要为了互动率乱开口子。",
    "粉丝运营的目标是提高长期信任，不是短期刷互动。",
    "对外表达必须与账号定位一致；账号主张模糊时，先回到 [xiaohongshu-commercial-growth](../xiaohongshu-commercial-growth/SKILL.md) 确认定位。",
    "涉及站外导流前，先检查平台安全边界，参考 [copywriting](../copywriting/SKILL.md) 中的社交平台内容安全过滤流程。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "personal-branding-advanced",
      source: new URL("./references/personal-branding-advanced.md", import.meta.url),
      target: "references/personal-branding-advanced.md",
      title: "personal-branding-advanced.md",
      summary: "Reference material for fan-operations.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "private-domain",
      source: new URL("./references/private-domain.md", import.meta.url),
      target: "references/private-domain.md",
      title: "private-domain.md",
      summary: "Reference material for fan-operations.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
