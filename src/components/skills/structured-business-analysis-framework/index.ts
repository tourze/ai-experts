import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { businessModelSkill } from "../business-model/index";

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
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
