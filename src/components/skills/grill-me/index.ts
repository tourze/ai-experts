import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { thinkingPartnerSkill } from "../thinking-partner/index";

export const grillMeSkill = defineSkill({
  id: "grill-me",
  fullName: "追问到底",
  description: "当需要对方案、设计或决策做高压质询来压实假设时使用。用户提到\"grill me\"\"狠狠质问我\"\"压力测试这个方案\"时触发。",
  useCases: [
    "用户说“grill me”“狠狠质问我”“帮我压力测试这个方案”。",
    "方案已经有雏形，但关键假设、依赖、风险还没被彻底验证。",
    "需要把模糊的设计选择变成可回答、可验证的问题链。",
    "用户已经准备接受逐步追问，并希望把方案压到可以决策或验证。",
  ],
  constraints: [
    "一次只问一个问题，不搞机关枪式提问。",
    "每个问题都要说明为什么现在问、它在决策树里的位置是什么。",
    "每个问题都给出推荐基线答案，帮助用户理解什么样的答案才算过关。",
    "如果问题可以通过代码库、配置或现有事实直接回答，先去查，再决定要不要继续问用户。",
    "必须沿着依赖关系推进：范围 → 约束 → 风险 → 验证 → 发布，而不是跳来跳去。",
    "当关键分支已经收敛时，要停下来总结，而不是为了“狠”而继续发问。",
  ],
  checklist: [
    "是否问清了目标、成功标准和失败代价。",
    "是否压实了负责人、依赖、时间线和验证方式。",
    "是否覆盖了发布路径、回滚、监控和测试。",
    "是否对高风险假设提出了可执行的验证问题。",
    "是否把已经回答清楚的分支及时关闭。",
  ],
  relatedSkills: [
    {
      get id() {
        return thinkingPartnerSkill.id;
      },
      reason: "如果用户连问题本身都还没说清，先用 `thinking-partner` 收敛；如果用户想通过被提问来学习而非验证方案，使用其中的 Socratic teaching 方法。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "机关枪式提问",
      pass: "一次一问",
    }),
    defineAntiPattern({
      fail: "泛泛追问",
      pass: "落到具体场景",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认要压力测试的具体方案和单一成功标准；问题本身不清时转 thinking-partner 收敛。",
      "一次只问一个问题，每问都说明为什么现在问、它位于范围/约束/风险/验证/发布哪一层。",
      "每个问题给推荐基线答案，让用户知道什么样的回答才算过关。",
      "如果回答已压实，就关闭该分支；如果回答仍模糊，就继续追问验证路径、负责人、回滚或监控。",
      "关键分支收敛后停止追问，输出未关闭风险和下一步验证动作。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "逐个问题、提问理由、推荐基线答案和用户回答状态。",
      "已压实的目标、约束、负责人、验证路径、发布/回滚/监控边界。",
      "仍未关闭的高风险假设、需要查证的事实和下一步行动。",
    ],
  }),
});
