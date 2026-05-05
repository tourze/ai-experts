import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const crossPollinationEngineSkill = defineSkill({
  id: "cross-pollination-engine",
  fullName: "跨界迁移引擎",
  description: "当需要借鉴其他行业机制、跨界类比、模式迁移、外部案例或跳出本行业寻找解法时使用。",
  useCases: [
    "用户说“别的行业会怎么做”“能借鉴谁”“跳出当前行业想一想”。",
    "现有方案卡在惯性思维里，需要借远场样本打破局限。",
    "适合产品、服务、运营、教育、体验设计等需要新灵感的场景。",
    "如果核心任务本身还没剥离清楚，先用 [first-principles-decomposer](../first-principles-decomposer/SKILL.md)。",
    "如果想把跨界灵感继续发散到研究问题，可接 [scientific-brainstorming](../scientific-brainstorming/SKILL.md)。",
    "需要案例时，参考 [跨界示例](references/examples.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "Reference material for cross-pollination-engine.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
