import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const scpAnalysisSkill = defineSkill({
  id: "scp-analysis",
  fullName: "SCP 分析模型",
  description: "当用户要分析外部冲击对行业和企业的传导影响或连锁效应时使用。常规竞争分析或内部经营诊断不适用。",
  useCases: [
    "分析外部冲击（政策/技术/经济/社会变化）对企业的传导影响。",
    "与 `pestel-analysis` 配合：PESTEL 扫描外部因素，SCP 分析传导路径。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
