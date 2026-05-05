import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const prlctlVmControlSkill = defineSkill({
  id: "prlctl-vm-control",
  description: "当用户通过 prlctl 控制 Parallels Desktop 虚拟机、采集状态或执行客体命令时使用。",
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
      id: "file-transfer",
      entry: new URL("./scripts/file_transfer.mjs", import.meta.url),
      target: "scripts/file_transfer.mjs",
      runtime: "node",
      bundle: false,
      description: "Script file_transfer.mjs.",
    }),
    defineSkillScript({
      id: "powershell-output",
      entry: new URL("./scripts/powershell_output.mjs", import.meta.url),
      target: "scripts/powershell_output.mjs",
      runtime: "node",
      bundle: false,
      description: "Script powershell_output.mjs.",
    }),
    defineSkillScript({
      id: "prlctl-helper",
      entry: new URL("./scripts/prlctl_helper.mjs", import.meta.url),
      target: "scripts/prlctl_helper.mjs",
      runtime: "node",
      bundle: false,
      description: "Script prlctl_helper.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "recipes",
      source: new URL("./references/recipes.md", import.meta.url),
      target: "references/recipes.md",
      title: "recipes.md",
      summary: "Reference material for prlctl-vm-control.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for prlctl-vm-control.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
