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
  constraints: [
    "传导链条：外部冲击 -> 行业结构(Structure) -> 企业行为(Conduct) -> 经营绩效(Performance)。",
    "**不能跳过中间环节**：冲击不是直接影响绩效，而是通过结构和行为间接影响。\"AI 出现了 -> 我们要转型 AI\"就是跳过了传导分析。",
    "同一冲击对不同行业、不同规模企业的传导路径可能完全不同——必须区分领先企业、中小企业和自身。",
    "行业结构变化往往是不可逆的，企业行为必须适应而非抵抗。",
  ],
  checklist: [
    "传导链条完整：冲击 -> 结构 -> 行为 -> 绩效。",
    "没有跳过中间环节直接从冲击推绩效。",
    "区分了对不同类型企业的差异化影响。",
    "给出了基于传导分析的战略建议。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
