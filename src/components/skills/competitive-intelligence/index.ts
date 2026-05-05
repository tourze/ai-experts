import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
    "不用框架合理化已有结论——如果结论先于分析得出，分析就是表演。",
    "不堆框架：3 个互补框架 > 10 个重叠框架。",
    "不混淆框架输出和事实：SWOT 的 Strength 是判断，必须回溯到证据。",
    "不做静态分析：标注分析的时效性和重新评估的触发条件。",
  ],
  checklist: [
    "已说明分析目标、时间窗口和目标受众。",
    "核心差异覆盖产品、定价、定位和 GTM 信号。",
    "每条结论都有来源或明确标注为推断。",
    "已给出销售、产品或市场的后续动作。",
    "高级档：至少 3 个框架交叉验证同一结论。",
    "高级档：标注了各结论的置信度和验证框架。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "截图堆砌",
      pass: "输出竞品变化、对我方影响和推荐动作，而不是素材堆叠。",
    }),
    defineAntiPattern({
      fail: "比 10 个竞品",
      pass: "按 Direct/Adjacent/Watch 聚焦 2-3 个真实威胁。",
    }),
    defineAntiPattern({
      fail: "堆框架但各说各话",
      pass: "用互补框架交叉验证，最后只合成高置信度结论。",
    }),
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
      summary: "竞品拆解方法论：从功能、定价、用户体验到市场定位的系统分析框架。",
      loadWhen:
        "需要深入拆解单个竞品的产品策略时读取。",
    }),
    defineReference({
      id: "multi-framework-output-template",
      source: new URL(
        "./references/multi-framework-output-template.md",
        import.meta.url,
      ),
      target: "references/multi-framework-output-template.md",
      title: "multi-framework-output-template.md",
      summary: "多框架融合输出模板：Porter/BCG/SWOT 等多框架交叉分析的输出格式。",
      loadWhen:
        "需要整合多种分析框架生成综合竞争情报报告时读取。",
    }),
    defineReference({
      id: "obviously-awesome",
      source: new URL("./references/obviously-awesome.md", import.meta.url),
      target: "references/obviously-awesome.md",
      title: "obviously-awesome.md",
      summary: "Obviously Awesome 定位方法论：市场类别选择、竞争对比与差异化定位。",
      loadWhen:
        "需要重新定位产品或确定目标市场类别时读取。",
    }),
  ],
});
