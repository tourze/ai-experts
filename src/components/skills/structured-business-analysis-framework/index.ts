import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { businessModelSkill } from "../business-model/index";
import { evidenceQualityFrameworkSkill } from "../evidence-quality-framework/index";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { mckinseyStepSkill } from "../mckinsey-7-step/index";

export const structuredBusinessAnalysisFrameworkSkill = defineSkill({
  id: "structured-business-analysis-framework",
  fullName: "结构化商业分析框架",
  description: "当需要把开放式商业问题转成结构化分析时使用：从 5W2H 问题界定、MECE 假设树、证据分层（事实/推断/假设）、按问题类型选择分析模型，到设计最小验证计划与可执行建议。与 mckinsey-7-step 互补：后者给七步流程框架，本 skill 给每步的具体方法与模板。",
  useCases: [
    "收到\"业绩为什么下滑\"\"该不该进这个市场\"等开放式商业问题",
    "需要把模糊问题拆成可验证的 MECE 假设树",
    "需要在多个分析框架中做选择（PESTEL/五力/3C/BMC/4P/记分卡）",
    "需要区分事实、推断和假设，把分析结论的可信度显式标出来",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "问题界定包含 5W2H 七个维度，有明确的\"不回答什么\"。",
    "假设树一级分支 MECE，每个二级假设可验证。",
    "每个发现标注了证据级别（事实/推断/假设/待确认）。",
    "模型选择说明了选 A 的理由和不选 B/C/D 的理由。",
    "P0 假设有完整验证计划（数据来源/方法/通过标准/反证信号）。",
    "行动建议 ≤3 条，每条有验证指标和停止条件。",
  ],
  relatedSkills: [
    {
      get id() {
        return businessModelSkill.id;
      },
      reason: "`business-model`：商业模式分析。",
    },
    {
      get id() {
        return businessModelSkill.id;
      },
      label: "`business-model`",
      reason: "``business-model``：商业模式分析",
    },
    {
      get id() {
        return mckinseyStepSkill.id;
      },
      reason: "`mckinsey-7-step`：麦肯锡七步问题解决法。",
    },
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "`first-principles-decomposer`：第一性原理拆解。",
    },
    {
      get id() {
        return evidenceQualityFrameworkSkill.id;
      },
      reason: "`evidence-quality-framework`：证据质量标注方法论。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
