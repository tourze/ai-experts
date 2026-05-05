import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { designingGrowthLoopsSkill } from "../designing-growth-loops/index";
import { portersFiveForcesSkill } from "../porters-five-forces/index";

export const bcgMatrixSkill = defineSkill({
  id: "bcg-matrix",
  fullName: "BCG 矩阵（波士顿矩阵 + GE-McKinsey 九宫格）",
  description: "当用户要用 BCG/GE 矩阵做产品组合分析、业务优先级排序或资源分配决策时使用。",
  useCases: [
    "多产品/多业务线公司的资源分配、投资优先级排序。",
    "默认 BCG 2x2 快速分类；需要更精细的多维评估时切到 GE-McKinsey 九宫格模式（见下文）。",
  ],
  constraints: [
    "**相对**市场份额：对标最大竞品，不是绝对数字。分界线按行业调——SaaS 的\"高增长\"和制造业完全不同，不要默认 10%/1.0。",
    "问题象限是唯一需要 Go/No-Go 选择的——给窗口期 + 里程碑，到期不达标就砍。",
    "全投 = 没决策。BCG 的核心价值是**强迫取舍**。",
    "最终输出必须包含资源流向：现金牛 →→ 明星 + 被选中的问题业务，瘦狗 → 退出释放资源。",
  ],
  checklist: [
    "[ ] 相对市场份额是对比最大竞品，不是绝对数字。",
    "[ ] 分界线设定有行业依据。",
    "[ ] 问题业务做了选择（不能全投也不能全砍）。",
    "[ ] 给出了明确的资源流向建议。",
    "[ ] 用 GE 模式时：指标权重有行业依据（不是平均分配），内外部维度至少各 5 个指标，九宫格定位转化为具体战略动作。",
  ],
  relatedSkills: [
    {
      get id() {
        return portersFiveForcesSkill.id;
      },
      reason: "评估外部竞争：BCG/GE 看内部组合，不看行业结构。用 `porters-five-forces`。",
    },
    {
      get id() {
        return designingGrowthLoopsSkill.id;
      },
      label: "s-curve-growth",
      reason: "单产品公司：BCG/GE 都是多业务组合工具。用 `s-curve-growth` 判断生命阶段。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
