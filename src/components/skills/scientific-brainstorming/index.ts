import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { crossPollinationEngineSkill } from "../cross-pollination-engine/index";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";

export const scientificBrainstormingSkill = defineSkill({
  id: "scientific-brainstorming",
  fullName: "科学脑暴",
  description: "当需要围绕研究问题做科学脑暴、跨学科联想、实验设计探索、方法创新或假设生成时使用。",
  useCases: [
    "用户要找研究方向、跨学科连接、方法创新或潜在研究空白。",
    "适合课题早期、概念阶段、实验设计探索阶段。",
    "用户需要的是共创式发散，而不是教科书式讲解。",
    "如果要借其他行业或学科的成熟机制，可结合 `cross-pollination-engine`。",
    "如果要先拆掉既有假设，再重建研究问题，可结合 `first-principles-decomposer`。",
    "需要更结构化方法时，参考 [brainstorming_methods.md](references/brainstorming_methods.md)。",
  ],
  constraints: [
    "这是协作式对话，不是单向授课；用户至少应贡献一半以上信息和判断。",
    "先理解研究目标、已有证据、方法约束，再进入发散阶段。",
    "发散阶段先追求多样性，暂不急着筛选；评价阶段再收敛。",
    "可以用跨尺度、反转假设、移除约束、技术迁移等方式拓展可能性。",
    "不要把“看起来新”误判成“值得发表/一定成立”；创新与可验证性必须分开讨论。",
    "结束时必须给出 1-3 个最值得继续验证的方向，以及下一步验证动作。",
  ],
  checklist: [
    "是否先弄清研究目标、证据基础和方法约束。",
    "是否生成了多个彼此差异明显的候选方向。",
    "是否显式区分了“创意有趣”和“创意可验证”。",
    "是否指出了最值得继续的 1-3 个方向。",
    "是否给出下一步文献搜索、实验或合作动作。",
    "是否避免对结果作过度承诺。",
  ],
  relatedSkills: [
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "如果要先拆掉既有假设，再重建研究问题，可结合 `first-principles-decomposer`。",
    },
    {
      get id() {
        return crossPollinationEngineSkill.id;
      },
      reason: "如果要借其他行业或学科的成熟机制，可结合 `cross-pollination-engine`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "brainstorming-methods",
      source: new URL("./references/brainstorming_methods.md", import.meta.url),
      target: "references/brainstorming_methods.md",
      title: "brainstorming_methods.md",
      summary: "Reference material for scientific-brainstorming.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
