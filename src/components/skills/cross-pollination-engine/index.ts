import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { scientificBrainstormingSkill } from "../scientific-brainstorming/index";

export const crossPollinationEngineSkill = defineSkill({
  id: "cross-pollination-engine",
  fullName: "跨界迁移引擎",
  description: "当需要借鉴其他行业机制、跨界类比、模式迁移、外部案例或跳出本行业寻找解法时使用。",
  useCases: [
    "用户说“别的行业会怎么做”“能借鉴谁”“跳出当前行业想一想”。",
    "现有方案卡在惯性思维里，需要借远场样本打破局限。",
    "适合产品、服务、运营、教育、体验设计等需要新灵感的场景。",
    "需要把外部案例转译成当前场景下可验证的小实验。",
  ],
  constraints: [
    "先把问题改写成“核心任务”，去掉行业行话和既有解决方案。",
    "每次优先找 2-4 个相距较远的行业，而不是同业竞品互抄。",
    "提取的是底层机制、激励结构和体验原则，不是表面 UI 或营销语。",
    "每个借鉴都要翻译成“在我们这里最小能怎么试”，而不是停在灵感层。",
    "迁移时必须保留本地约束：成本、监管、团队能力、用户习惯。",
    "最后收敛成一个可验证的小实验，而不是十个脑洞。",
  ],
  checklist: [
    "是否已经把问题改写成核心任务。",
    "借鉴源是否足够“远”，而不是同质化对标。",
    "是否提取了原理，而不是表面特征。",
    "是否说明了迁移后的约束和修改点。",
    "是否收敛成一个最小实验。",
    "是否明确了验证成功的信号。",
  ],
  relatedSkills: [
    {
      get id() {
        return scientificBrainstormingSkill.id;
      },
      reason: "跨界灵感需要继续发散成研究问题、实验假设或科学式探索时联动。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "核心任务还没剥离清楚，或行业行话遮蔽真实问题时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "同业互抄",
      pass: "跨界远场",
    }),
    defineAntiPattern({
      fail: "借表面不借机制",
      pass: "提取原理",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把当前行业问题改写成核心任务，从远场行业提取底层机制，并转译成当前约束下可验证的最小实验。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先把问题改写成核心任务，去掉行业行话、既有方案和表面诉求。",
      "选择 2-4 个相距较远的借鉴源，不做同业竞品互抄；需要案例时读取 examples。",
      "对每个借鉴源拆出他们怎么解决、背后的机制、激励结构、体验原则和迁移条件。",
      "把机制翻译成当前场景的最小可试版本，并保留成本、监管、团队能力和用户习惯约束。",
      "最后收敛成一个本周能验证的小实验，定义成功信号和反证条件。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "核心任务改写、借鉴行业清单和选择理由。",
      "每个借鉴源的解决方式、底层原理、迁移方式和本地约束。",
      "合成方案、最小实验、成功信号、反证条件和需要继续研究的问题。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "跨界迁移真实案例集：各行业模式借鉴的成功与失败经验。",
      loadWhen: "需要参考跨界案例来启发新的灵感或验证迁移模式时读取。",
    }),
  ],
});
