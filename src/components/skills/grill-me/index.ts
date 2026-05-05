import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const grillMeSkill = defineSkill({
  id: "grill-me",
  fullName: "追问到底",
  description: "当需要对方案、设计或决策做高压质询来压实假设时使用。用户提到\"grill me\"\"狠狠质问我\"\"压力测试这个方案\"时触发。",
  useCases: [
    "用户说“grill me”“狠狠质问我”“帮我压力测试这个方案”。",
    "方案已经有雏形，但关键假设、依赖、风险还没被彻底验证。",
    "需要把模糊的设计选择变成可回答、可验证的问题链。",
    "如果用户连问题本身都还没说清，先用 [thinking-partner](../thinking-partner/SKILL.md) 收敛。",
    "如果用户想通过被提问来学习而非验证方案，转到 [socratic-teaching](../thinking-partner/SKILL.md)。",
  ],
  constraints: [
    "一次只问一个问题，不搞机关枪式提问。",
    "每个问题都要说明为什么现在问、它在决策树里的位置是什么。",
    "每个问题都给出推荐基线答案，帮助用户理解什么样的答案才算过关。",
    "如果问题可以通过代码库、配置或现有事实直接回答，先去查，再决定要不要继续问用户。",
    "必须沿着依赖关系推进：范围 → 约束 → 风险 → 验证 → 发布，而不是跳来跳去。",
    "当关键分支已经收敛时，要停下来总结，而不是为了“狠”而继续发问。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
