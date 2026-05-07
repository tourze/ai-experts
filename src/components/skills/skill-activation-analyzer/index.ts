import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, skillActivationAnalyzerCsoAudit } from "../../procedures/index";

export const skillActivationAnalyzerSkill = defineSkill({
  id: "skill-activation-analyzer",
  fullName: "Skill Activation Analyzer",
  description: "当需要诊断 skill 触发是否正确、分析 skill 命中/漏触发/误触发原因、排查多 skill 冲突、评估 skill 路由健康度或批量审查 description 文本质量（原 description-cso-audit）时使用。",
  useCases: [
    "用户报告某次 skill 没触发、误触发或多 skill 抢同一个请求。",
    "需要评估一组 skill 的路由覆盖度、区分度、触发词密度和排他指引。",
    "需要批量审查 description 文本质量，识别 workflow_leak、output_leak、missing_trigger、tool_leak、too_long 或 too_short。",
  ],
  constraints: [
    "必须先还原用户真实意图、候选 skill 和实际触发结果；不能只看 description 文本下结论。",
    "触发问题优先通过 description 区分度和触发条件修复，不通过修改 SKILL.md 正文绕过。",
    "选定诊断模式后必须读取 `diagnosis-modes` reference 中对应模式的完整流程。",
    "批量静态审查优先调用 `skill-activation-analyzer-cso-audit` procedure，再按 rewrite-examples 修复。",
  ],
  checklist: [
    "是否明确当前模式：单次诊断、冲突检测、健康度评估或静态文本审查。",
    "是否还原了用户意图、候选 skill、实际触发/漏触发结果和插件层级。",
    "是否区分了覆盖不足、区分度不足、触发词误导和路由链路断点。",
    "是否只建议修改 description/frontmatter，而不是用正文修触发。",
    "批量审查是否给出 procedure 输出、违规类别和具体 rewrite 建议。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "看 description 文本下结论",
      pass: "还原意图再匹配",
    }),
    defineAntiPattern({
      fail: "合并冲突 skill",
      pass: "区分度优化",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先选择模式：单次诊断、冲突检测、健康度评估或 description 静态文本审查。",
      "单次诊断还原用户意图、模拟候选匹配、对比实际触发结果并定位根因。",
      "冲突检测提取 skill 触发域，构建重叠矩阵，区分同层冲突、上下游分工和合理宽口径入口。",
      "健康度评估检查覆盖度、区分度、触发词密度、排他指引和触发链路断点。",
      "静态文本审查调用 cso-audit procedure，按 rewrite-examples 给出 before/after description 修复。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "诊断模式、用户意图复原、候选 skill、实际触发行为和证据。",
      "根因分类：覆盖缺口、描述过宽/过窄、相似 skill 冲突、工具/流程泄漏或路由链路问题。",
      "description/frontmatter 修复建议、冲突矩阵、procedure 审查结果和需要复测的样例请求。",
    ],
  }),
  procedures: [
    procedureUse(skillActivationAnalyzerCsoAudit),
  ],
  references: [
    defineReference({
      id: "diagnosis-modes",
      source: new URL("./references/diagnosis-modes.md", import.meta.url),
      target: "references/diagnosis-modes.md",
      title: "diagnosis-modes.md",
      summary: "Skill 触发诊断的多种模式和方法，包含命中、漏触发和误触发的分析流程。",
      loadWhen: "需要诊断 skill 触发失败原因或分析多 skill 冲突时读取。",
    }),
    defineReference({
      id: "rewrite-examples",
      source: new URL("./references/rewrite-examples.md", import.meta.url),
      target: "references/rewrite-examples.md",
      title: "rewrite-examples.md",
      summary: "Skill frontmatter description 重写示例，包含 before/after 对比和设计原则。",
      loadWhen: "需要优化 skill 的 description 文本以提高触发准确率时读取。",
    }),
  ],
});
