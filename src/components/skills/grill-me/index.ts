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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
