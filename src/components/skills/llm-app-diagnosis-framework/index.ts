import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const llmAppDiagnosisFrameworkSkill = defineSkill({
  id: "llm-app-diagnosis-framework",
  fullName: "LLM 应用诊断框架",
  description: "当需要系统化诊断 LLM 应用问题（幻觉/检索失配/指令对抗/token 超限/过度引用）、区分 model-first 与 prompt-first 适用边界、或建立 eval-first 改进闭环时使用。与 llm-app-design-pipeline 互补：后者给设计流程，本 skill 给诊断方法与决策框架。",
  useCases: [
    "LLM 应用出现质量问题但不确定问题在哪一层",
    "需要判断用 model-first（让模型拆步骤）还是 prompt-first（人工设计 chain）",
    "需要建立\"先补 eval → 再改 prompt/检索\"的改进闭环",
    "prompt 改了很多轮但没有系统衡量效果",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
