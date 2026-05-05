import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const competitiveIntelligenceSkill = defineSkill({
  id: "competitive-intelligence",
  fullName: "竞品情报",
  description:
    "当用户要做竞品情报、battlecard、功能差距分析、市场定位、竞品深度拆解或竞争态势判断时使用。",
  useCases: [
    "基础档：竞品动态跟踪、battlecard、功能差距分析、市场定位。",
    "高级档：多框架交叉验证（Porter 五力 + SWOT + BCG + Blue Ocean 等），避免单一框架盲区。",
    "先做广度扫描，再决定是否进入[竞品深度拆解](references/competitive-teardown.md)。",
  ],
  constraints: [
    "先明确比较目的：赢单、路线图决策、定位更新或市场监控；不同目的的证据粒度不同。",
    '情报必须区分"公开事实""合理推断""内部假设"。',
    "输出要能直接支持行动，不是堆截图和链接。",
    "高级档：至少用 3 个互补框架交叉验证同一结论，不堆重叠框架。",
  ],
  checklist: [
    "已说明分析目标、时间窗口和目标受众。",
    "核心差异覆盖产品、定价、定位和 GTM 信号。",
    "每条结论都有来源或明确标注为推断。",
    "已给出销售、产品或市场的后续动作。",
    "高级档：至少 3 个框架交叉验证同一结论。",
    "高级档：标注了各结论的置信度和验证框架。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "competitive-teardown",
      source: new URL("./references/competitive-teardown.md", import.meta.url),
      target: "references/competitive-teardown.md",
      title: "competitive-teardown.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "multi-framework-output-template",
      source: new URL(
        "./references/multi-framework-output-template.md",
        import.meta.url,
      ),
      target: "references/multi-framework-output-template.md",
      title: "multi-framework-output-template.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "obviously-awesome",
      source: new URL("./references/obviously-awesome.md", import.meta.url),
      target: "references/obviously-awesome.md",
      title: "obviously-awesome.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
