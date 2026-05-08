import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const skillEvaluatorSkill = defineSkill({
  id: "skill-evaluator",
  fullName: "Skill Evaluator",
  description: "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  useCases: [
    "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  ],
  constraints: [
    "Mode A 评分前必须读取 evaluation-dimensions 和 evaluation-protocol。",
    "Mode B 知识覆盖验证必须分别配置 examiner 和 examinee 输入，并保持闭卷边界。",
    "评分只看知识增量、流程质量、反模式和可用性，不因格式漂亮或篇幅长给高分。",
    "触发质量仅优化 description 时转 skill-activation-analyzer；用参考 skill 优化目标 skill 时转 skill-evolver。",
    "不能把基础模型已知的概念包装成高价值 skill 知识。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "因为结构漂亮、篇幅长或术语多就给高分。",
      pass: "按 8 维度证据评分，重点看 expert-only knowledge 和可执行流程。",
    }),
    defineAntiPattern({
      fail: "闭卷验证时让 examinee 看到源材料，或用常识补答案。",
      pass: "examinee 只读被测 skill，答不出就记录 CANNOT_ANSWER。",
    }),
    defineAntiPattern({
      fail: "只优化 description，却启动完整结构评估。",
      pass: "触发域问题交给 skill-activation-analyzer。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先路由：设计质量评分用 Mode A，源材料覆盖验证用 Mode B，新建 skill 转 skill-creator，迁移优化转 skill-evolver，description 触发优化转 skill-activation-analyzer。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "Mode A 读取 evaluation-dimensions 和 evaluation-protocol，按 Knowledge Delta、Mindset/Procedures、Anti-Pattern、Specification、Progressive Disclosure、Freedom、Pattern、Usability 评分。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Mode A 对每节标 Expert、Activation 或 Redundant，再给 120 分总分和 A/B/C/D/F 等级。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Mode B 让 examiner 只读 source-path 出 5-8 题，每题含 answer_key 和 required_facts，覆盖细节、逻辑、集成三类。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "Mode B 让 examinee 只读 skill-path 答题，答不出写 CANNOT_ANSWER；逐题按 required_facts 判定 PASS/FAIL。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "失败时展示缺口建议补充，最多 3 轮；100% 通过后输出验证报告。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Mode A 设计评分报告：8 维度分数、证据、总分、等级、主要缺口和精简建议。",
      "Mode B 验证报告：通过率、轮次、失败题目、期望事实、实际答案和补充方向。",
      "路由建议：是否应转 skill-creator、skill-evolver 或 skill-activation-analyzer。",
    ],
  }),
  references: [
    defineReference({
      id: "evaluation-dimensions",
      source: new URL("./references/evaluation-dimensions.md", import.meta.url),
      target: "references/evaluation-dimensions.md",
      title: "evaluation-dimensions.md",
      summary: "Skill 质量评估的多维框架，包含知识完备性、结构合理性和描述准确性等维度。",
      loadWhen: "需要了解 skill 评估的具体维度和评分标准时读取。",
    }),
    defineReference({
      id: "evaluation-protocol",
      source: new URL("./references/evaluation-protocol.md", import.meta.url),
      target: "references/evaluation-protocol.md",
      title: "evaluation-protocol.md",
      summary: "Skill 评估的标准化协议和执行流程，包含闭卷验证和对比评估流程。",
      loadWhen: "需要按照标准化流程执行 skill 评估时读取。",
    }),
    defineReference({
      id: "examinee-prompt",
      source: new URL("./references/examinee-prompt.md", import.meta.url),
      target: "references/examinee-prompt.md",
      title: "examinee-prompt.md",
      summary: "Skill 评估中被评估角色（examinee）的提示词模板。",
      loadWhen: "需要在 skill 评估中配置被评估角色的输入提示时读取。",
    }),
    defineReference({
      id: "examiner-prompt",
      source: new URL("./references/examiner-prompt.md", import.meta.url),
      target: "references/examiner-prompt.md",
      title: "examiner-prompt.md",
      summary: "Skill 评估中评估角色（examiner）的提示词模板。",
      loadWhen: "需要在 skill 评估中配置评估角色判断标准时读取。",
    }),
    defineReference({
      id: "failure-patterns",
      source: new URL("./references/failure-patterns.md", import.meta.url),
      target: "references/failure-patterns.md",
      title: "failure-patterns.md",
      summary: "Skill 评估中常见的失败模式和应对策略参考。",
      loadWhen: "需要识别和避免 skill 评估中常见的误判和偏差时读取。",
    }),
  ],
});
