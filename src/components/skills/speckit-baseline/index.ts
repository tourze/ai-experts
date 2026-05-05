import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
      id: "bootstrap-specify",
      entry: new URL("./scripts/bootstrap-specify.mjs", import.meta.url),
      target: "scripts/bootstrap-specify.mjs",
      runtime: "node",
      bundle: false,
      description: "Script bootstrap-specify.mjs.",
    }),
    defineSkillScript({
      id: "check-prerequisites",
      entry: new URL("./scripts/check-prerequisites.mjs", import.meta.url),
      target: "scripts/check-prerequisites.mjs",
      runtime: "node",
      bundle: false,
      description: "Script check-prerequisites.mjs.",
    }),
    defineSkillScript({
      id: "common",
      entry: new URL("./scripts/common.mjs", import.meta.url),
      target: "scripts/common.mjs",
      runtime: "node",
      bundle: false,
      description: "Script common.mjs.",
    }),
    defineSkillScript({
      id: "create-new-feature",
      entry: new URL("./scripts/create-new-feature.mjs", import.meta.url),
      target: "scripts/create-new-feature.mjs",
      runtime: "node",
      bundle: false,
      description: "Script create-new-feature.mjs.",
    }),
    defineSkillScript({
      id: "setup-plan",
      entry: new URL("./scripts/setup-plan.mjs", import.meta.url),
      target: "scripts/setup-plan.mjs",
      runtime: "node",
      bundle: false,
      description: "Script setup-plan.mjs.",
    })
  ],
});
