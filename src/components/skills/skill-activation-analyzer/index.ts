import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const skillActivationAnalyzerSkill = defineSkill({
  id: "skill-activation-analyzer",
  fullName: "Skill Activation Analyzer",
  description: "当需要诊断 skill 触发是否正确、分析 skill 命中/漏触发/误触发原因、排查多 skill 冲突、评估 skill 路由健康度或批量审查 description 文本质量（原 description-cso-audit）时使用。",
  useCases: [
    "当需要诊断 skill 触发是否正确、分析 skill 命中/漏触发/误触发原因、排查多 skill 冲突、评估 skill 路由健康度或批量审查 description 文本质量（原 description-cso-audit）时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "cso-audit",
      entry: new URL("./scripts/cso_audit.mjs", import.meta.url),
      target: "scripts/cso_audit.mjs",
      runtime: "node",
      bundle: false,
      description: "Script cso_audit.mjs.",
    })
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
