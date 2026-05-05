import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
