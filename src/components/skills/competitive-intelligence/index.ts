import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const competitiveIntelligenceSkill = defineSkill({
  id: "competitive-intelligence",
  fullName: "竞品情报",
  description:
    "当用户要做竞品情报、battlecard、功能差距分析、市场定位、竞品深度拆解或竞争态势判断时使用。",
  useCases: [
    "基础档：竞品动态跟踪、battlecard、功能差距分析、市场定位。",
    "高级档：多框架交叉验证（Porter 五力 + SWOT + BCG + Blue Ocean 等），避免单一框架盲区。",
    "先做广度扫描，再决定是否进入单一竞品深度拆解。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先明确目的：赢单、路线图决策、定位更新或市场监控，并确定时间窗口和目标受众。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "聚焦 Direct、Adjacent、Watch 三类中的 2-3 个真实威胁，不把十几个竞品摊平比较。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "基础档输出近期变化、对我方影响、推荐动作和 battlecard：客户问法、竞品弱点、我方优势、一句话回应。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "高级档先收集竞品列表、功能矩阵、定价、渠道、目标客户和市场数据，不先选框架。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "选择 3-5 个互补框架独立分析，再交叉验证共识点、矛盾点和盲区；只输出高置信结论。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要单一竞品深拆或多框架模板时读取 competitive-teardown 或 multi-framework-output-template。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "竞品变化表：竞品、近期变化、对我方影响、推荐动作和时效性。",
      "Battlecard：客户问法、竞品弱点、我方优势、一句话回应。",
      "多框架输出矩阵：结论、验证框架、置信度、行动建议、矛盾点和需深入调查项。",
    ],
  }),
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
      id: "data-collection-guide",
      source: new URL("./references/data-collection-guide.md", import.meta.url),
      target: "references/data-collection-guide.md",
      title: "data-collection-guide.md",
      summary: "竞品情报证据收集来源、可信度分层和记录格式。",
      loadWhen: "需要为竞品拆解建立可复核证据库时读取。",
    }),
    defineReference({
      id: "scoring-rubric",
      source: new URL("./references/scoring-rubric.md", import.meta.url),
      target: "references/scoring-rubric.md",
      title: "scoring-rubric.md",
      summary: "竞品评分维度、权重和证据要求。",
      loadWhen: "需要把功能、体验、定价或市场信号量化成评分矩阵时读取。",
    }),
    defineReference({
      id: "analysis-templates",
      source: new URL("./references/analysis-templates.md", import.meta.url),
      target: "references/analysis-templates.md",
      title: "analysis-templates.md",
      summary: "竞品拆解输出模板、battlecard 和行动建议格式。",
      loadWhen: "需要把竞品证据整理成可交付报告或销售 battlecard 时读取。",
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
    defineReference({
      id: "positioning-canvas",
      source: new URL("./references/positioning-canvas.md", import.meta.url),
      target: "references/positioning-canvas.md",
      title: "positioning-canvas.md",
      summary: "从替代品、独特属性、价值、目标客户到市场类别的定位画布。",
      loadWhen: "需要重写产品定位或统一市场、销售、产品叙事时读取。",
    }),
    defineReference({
      id: "competitive-alternatives",
      source: new URL("./references/competitive-alternatives.md", import.meta.url),
      target: "references/competitive-alternatives.md",
      title: "competitive-alternatives.md",
      summary: "识别客户真实替代方案和错误比较框架。",
      loadWhen: "需要判断客户当前拿什么替代你、为什么会误判品类时读取。",
    }),
    defineReference({
      id: "unique-attributes",
      source: new URL("./references/unique-attributes.md", import.meta.url),
      target: "references/unique-attributes.md",
      title: "unique-attributes.md",
      summary: "独特属性筛选、证据要求和差异化防伪检查。",
      loadWhen: "需要提炼产品真正赢点或过滤泛泛差异化声明时读取。",
    }),
    defineReference({
      id: "value-mapping",
      source: new URL("./references/value-mapping.md", import.meta.url),
      target: "references/value-mapping.md",
      title: "value-mapping.md",
      summary: "把独特属性映射为客户可感知业务价值的方法。",
      loadWhen: "需要把技术能力转成客户价值、证明点和销售话术时读取。",
    }),
  ],
});
