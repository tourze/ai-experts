import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillParameter,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const speckitBaselineSkill = defineSkill({
  id: "speckit-baseline",
  fullName: "Speckit Baseline",
  description: "当用户要从现有代码反向抽取需求、建立初始 spec.md 或启动 legacy feature baseline 时使用。",
  useCases: [
    "当用户要从现有代码反向抽取需求、建立初始 spec.md 或启动 legacy feature baseline 时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  parameters: [
    defineSkillParameter({ name: "arguments", description: "用户原始输入，如功能名称、需求描述或其他上下文。" }),
  ],
  argumentHint: "[用户输入]",
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "bootstrap-specify",
      entry: new URL("./scripts/bootstrap-specify.ts", import.meta.url),
      target: "scripts/bootstrap-specify.mjs",
      runtime: "node",
      bundle: false,
      description: "Script bootstrap-specify.mjs.",
    }),
    defineSkillScript({
      id: "check-prerequisites",
      entry: new URL("./scripts/check-prerequisites.ts", import.meta.url),
      target: "scripts/check-prerequisites.mjs",
      runtime: "node",
      bundle: false,
      description: "Script check-prerequisites.mjs.",
    }),
    defineSkillScript({
      id: "common",
      entry: new URL("./scripts/common.ts", import.meta.url),
      target: "scripts/common.mjs",
      runtime: "node",
      bundle: false,
      description: "Script common.mjs.",
    }),
    defineSkillScript({
      id: "create-new-feature",
      entry: new URL("./scripts/create-new-feature.ts", import.meta.url),
      target: "scripts/create-new-feature.mjs",
      runtime: "node",
      bundle: false,
      description: "Script create-new-feature.mjs.",
    }),
    defineSkillScript({
      id: "setup-plan",
      entry: new URL("./scripts/setup-plan.ts", import.meta.url),
      target: "scripts/setup-plan.mjs",
      runtime: "node",
      bundle: false,
      description: "Script setup-plan.mjs.",
    })
  ],
});
