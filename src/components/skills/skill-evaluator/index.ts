import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const skillEvaluatorSkill = defineSkill({
  id: "skill-evaluator",
  fullName: "Skill Evaluator",
  description: "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  useCases: [
    "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
      summary: "Skill 评估的标准化协议和执行步骤，包含闭卷验证和对比评估流程。",
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
