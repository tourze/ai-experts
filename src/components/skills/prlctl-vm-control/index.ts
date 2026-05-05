import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const prlctlVmControlSkill = defineSkill({
  id: "prlctl-vm-control",
  fullName: "prlctl-vm-control",
  description: "当用户通过 prlctl 控制 Parallels Desktop 虚拟机、采集状态或执行客体命令时使用。",
  useCases: [
    "需要在 macOS 宿主机上列出、定位、开关机、挂起、恢复或查看 Parallels Desktop 虚拟机详情。",
    "需要在 Windows 或 Linux 客体里执行离散命令、上传文件或下载文件，并优先复用 [辅助脚本](./scripts/prlctl_helper.mjs) 而不是手写长命令。",
    "需要在隔离环境里复现 Windows 桌面自动化问题时，可联动 [windows-ui-automation](../windows-ui-automation/SKILL.md)。",
    "需要在虚拟机里验证驱动、回调、VBS/HVCI 等低层问题时，可联动 [windows-kernel-security](../windows-kernel-security/SKILL.md)。",
    "需要快速查常见命令模板时，读取 [操作配方](./references/recipes.md)；需要对外展示入口文案时，参考 [Agent 配置](./agents/openai.yaml)。",
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
  ],
});
