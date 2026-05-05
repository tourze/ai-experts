import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { processOptimizationSkill } from "../process-optimization/index";

export const businessHealthDiagnosticSkill = defineSkill({
  id: "business-health-diagnostic",
  fullName: "业务健康度诊断",
  description:
    "当用户要诊断业务健康度、做季度复盘或用记分卡发现增长/留存/效率问题时使用。",
  useCases: [
    "季度复盘、董事会汇报前快速评估业务整体健康度。",
    '感觉"哪里不对"但说不清楚，需要系统化扫描定位问题。',
    "与 `process-optimization` 配合优化发现的瓶颈。",
    "需要更深入的专项分析时：\n- [references/balanced-scorecard.md](references/balanced-scorecard.md) — BSC 战略翻译工具\n- [references/blm-model.md](references/blm-model.md) — 业务领先模型（差距分析 + 战略执行）\n- [references/mckinsey-7s.md](references/mckinsey-7s.md) — 麦肯锡 7S 组织匹配模型",
  ],
  constraints: [
    "诊断必须覆盖 4 个象限（增长、留存、效率、现金），不能只看收入。",
    '每个指标必须有**当前值、趋势方向和对标基准**，不允许只说"还行"。',
    "红黄绿判断必须有明确阈值，不靠感觉打标。",
    "诊断结论必须指向**最多 3 个优先行动**，不是列 20 个待改善项。",
  ],
  checklist: [
    "4 个象限都做了扫描，没有只看增长忽略效率。",
    "每个指标有当前值、趋势和基准三要素。",
    "红黄绿状态有明确阈值定义。",
    "诊断结论收敛到 ≤3 个优先行动。",
  ],
  relatedSkills: [
    {
      get id() {
        return processOptimizationSkill.id;
      },
      reason: "与 `process-optimization` 配合优化发现的瓶颈。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看收入",
      pass: "四象限全扫",
    }),
    defineAntiPattern({
      fail: "列 20 个待改善项",
      pass: "聚焦 Top 3",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "balanced-scorecard",
      source: new URL("./references/balanced-scorecard.md", import.meta.url),
      target: "references/balanced-scorecard.md",
      title: "balanced-scorecard.md",
      summary: "平衡计分卡框架：财务、客户、流程、学习四维度诊断模板。",
      loadWhen:
        "需要从多维度结构化评估企业经营健康度时读取。",
    }),
    defineReference({
      id: "blm-model",
      source: new URL("./references/blm-model.md", import.meta.url),
      target: "references/blm-model.md",
      title: "blm-model.md",
      summary: "BLM 业务领先模型：战略、执行、领导力与价值观的差距分析。",
      loadWhen:
        "需要诊断战略与执行之间的差距或对标行业领先实践时读取。",
    }),
    defineReference({
      id: "mckinsey-7s",
      source: new URL("./references/mckinsey-7s.md", import.meta.url),
      target: "references/mckinsey-7s.md",
      title: "mckinsey-7s.md",
      summary: "麦肯锡 7S 模型：战略、结构、制度、风格、人员、技能、共同价值观的组织诊断框架。",
      loadWhen:
        "需要诊断组织内部一致性与变革阻力时读取。",
    }),
  ],
});
