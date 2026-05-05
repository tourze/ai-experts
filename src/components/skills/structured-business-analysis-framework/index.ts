import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const structuredBusinessAnalysisFrameworkSkill = defineSkill({
  id: "structured-business-analysis-framework",
  description: "当需要把开放式商业问题转成结构化分析时使用：从 5W2H 问题界定、MECE 假设树、证据分层（事实/推断/假设）、按问题类型选择分析模型，到设计最小验证计划与可执行建议。与 mckinsey-7-step 互补：后者给七步流程框架，本 skill 给每步的具体方法与模板。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for structured-business-analysis-framework.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
