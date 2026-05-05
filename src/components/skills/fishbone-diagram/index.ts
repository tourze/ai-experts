import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { mckinseyStepSkill } from "../mckinsey-7-step/index";
import { priorityJudgeSkill } from "../priority-judge/index";

export const fishboneDiagramSkill = defineSkill({
  id: "fishbone-diagram",
  fullName: "鱼骨图（因果分析图）",
  description: "当用户要用鱼骨图、Ishikawa 或 5 Whys 做根因分析和因果排查时使用。",
  useCases: [
    "复杂问题的根因分析：避免\"头痛医头\"。",
    "质量问题排查、故障诊断、流程改进。",
    "与 `mckinsey-7-step` 配合：七步法的第二步（分解问题）可以用鱼骨图。问题定义阶段的补充工具见 [references/five-w-two-h.md](references/five-w-two-h.md)。",
  ],
  constraints: [
    "主要类别（大骨）按场景选择：\n- 制造业：人/机/料/法/环（5M）\n- 服务业：人员/流程/政策/设备/外部\n- 软件/产品：产品/技术/运营/市场/组织",
    "每个原因要追问\"为什么\"至少 **2-3 层深度**——第一层谁都能写，根因在第二三层。",
    "最终必须**锁定 1-3 个根本原因**，不是列一堆然后结束。",
    "根因要有验证方法（如何确认这是真正的根因），不是猜测。",
  ],
  checklist: [
    "[ ] 主要类别覆盖全面（至少 4 个维度）。",
    "[ ] 每个原因至少追问了 2 层\"为什么\"。",
    "[ ] 最终锁定了 1-3 个根本原因。",
    "[ ] 根因有验证方法，不是猜测。",
  ],
  relatedSkills: [
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      label: "inversion-strategist",
      reason: "系统性风险预判：鱼骨图分析已发生的问题，未来风险预判与事前验尸用 `inversion-strategist`。",
    },
    {
      get id() {
        return mckinseyStepSkill.id;
      },
      reason: "与 `mckinsey-7-step` 配合：七步法的第二步（分解问题）可以用鱼骨图。问题定义阶段的补充工具见 references/five-w-two-h.md。",
    },
    {
      get id() {
        return priorityJudgeSkill.id;
      },
      reason: "原因已知只需排优先级：鱼骨图是发散找原因的工具，原因已知时直接用 `priority-judge` 排序。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "five-w-two-h",
      source: new URL("./references/five-w-two-h.md", import.meta.url),
      target: "references/five-w-two-h.md",
      title: "five-w-two-h.md",
      summary: "Reference material for fishbone-diagram.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
