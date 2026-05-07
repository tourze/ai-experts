import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, prlctlVmControlFileTransfer, prlctlVmControlPowershellOutput, prlctlVmControlPrlctlHelper } from "../../procedures/index";

import { windowsKernelSecuritySkill } from "../windows-kernel-security/index";
import { windowsUiAutomationSkill } from "../windows-ui-automation/index";

export const prlctlVmControlSkill = defineSkill({
  id: "prlctl-vm-control",
  fullName: "prlctl-vm-control",
  description: "当用户通过 prlctl 控制 Parallels Desktop 虚拟机、采集状态或执行客体命令时使用。",
  useCases: [
    "需要在 macOS 宿主机上列出、定位、开关机、挂起、恢复或查看 Parallels Desktop 虚拟机详情。",
    "需要在 Windows 或 Linux 客体里执行离散命令、上传文件或下载文件，并优先复用 `procedure prlctl-vm-control-prlctl-helper` 而不是手写长命令。",
    "需要在隔离环境里复现 Windows 桌面自动化问题时，可联动 `windows-ui-automation`。",
    "需要在虚拟机里验证驱动、回调、VBS/HVCI 等低层问题时，可联动 `windows-kernel-security`。",
    "需要快速查常见命令模板时，读取 [操作配方](./references/recipes.md)。",
  ],
  constraints: [
    "先 `list` / `resolve`，后 `info` / `exec` / `power`；不要对模糊选择器直接做高风险动作。",
    "`--user` 必须与 `--password-env` 一起使用，避免触发交互式密码提示；桌面登录态任务优先 `--current-user`。",
    "`reset`、`stop --kill`、`snapshot-switch`、`snapshot-delete`、`prlctl set` 都属于高风险动作，只有用户明确要求时才执行。",
    "优先把任务拆成多个可验证的小命令；失败时先保留 stdout / stderr，再缩小范围重试。",
    "如果任务依赖 GUI、剪贴板、浏览器会话或登录态，不要假定 `prlctl exec` 默认上下文正确，必须先做身份验证。",
    "Windows 文本输出优先走 `--shell powershell`，helper 会用 Base64 envelope 规避中文输出在 `prlctl` / 终端链路中的编码损坏；只有需要完全手写进程参数时才用 `--shell raw`。",
    "文件传输走 helper 的 `upload` / `download`，默认会分片传输并覆盖目标文件；传输敏感文件前先确认目标路径和登录上下文。",
    "诊断 helper 挂起时只输出 PID、PPID、状态、运行时长和可执行文件名等摘要；不要把 Claude / CLI 临时任务输出、完整 `ps aux` 长命令行或 PowerShell/Base64 payload 直接贴回对话。",
  ],
  checklist: [
    "目标虚拟机是否已经通过 `resolve` 变成唯一结果。",
    "执行动作前是否已采集 `status` / `info` 作为基线证据。",
    "Windows 客体任务是否确认了执行上下文：服务态、当前登录用户，还是显式账户。",
    "文件传输是否确认了方向、源路径、目标路径和覆盖风险。",
    "排查挂起时是否避免读取 `/private/tmp/claude-*/*/tasks/*.output` 或输出完整长命令行。",
    "使用 `--user` 时是否同时提供了 `--password-env`，并确认密码来自环境变量而非命令行明文。",
    "高风险动作前是否确认快照、回滚路径和用户授权。",
  ],
  relatedSkills: [
    {
      get id() {
        return windowsKernelSecuritySkill.id;
      },
      reason: "需要在虚拟机里验证驱动、回调、VBS/HVCI 等低层问题时，可联动 `windows-kernel-security`。",
    },
    {
      get id() {
        return windowsUiAutomationSkill.id;
      },
      reason: "需要在隔离环境里复现 Windows 桌面自动化问题时，可联动 `windows-ui-automation`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "模糊名称直接高风险",
      pass: "resolve 再执行",
    }),
    defineAntiPattern({
      fail: "密码命令行明文",
      pass: "--password-env",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "通过 prlctl helper 安全定位 Parallels 虚拟机、采集状态、执行客体命令并完成上传/下载等可审计操作。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先用 helper 的 `list` / `resolve` 把目标虚拟机解析为唯一对象，再采集 `status` / `info` 作为基线。",
      "执行客体命令前先做小命令或 dry-run；Windows 输出优先走 PowerShell envelope，依赖登录态的任务先确认当前用户上下文。",
      "上传和下载统一走 file-transfer procedure，执行前确认方向、源路径、目标路径和覆盖风险。",
      "只有用户明确要求时才执行 reset、kill stop、snapshot 切换/删除或 `prlctl set`；常见模板读取 recipes reference。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "唯一虚拟机标识、状态/info 基线、执行上下文和选择的 procedure。",
      "客体命令或文件传输的 stdout/stderr 摘要、退出码、失败原因和下一步缩小范围动作。",
      "高风险动作的用户授权、快照/回滚路径和操作后验证结果。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(prlctlVmControlFileTransfer),
    procedureUse(prlctlVmControlPowershellOutput),
    procedureUse(prlctlVmControlPrlctlHelper),
  ],
  references: [
    defineReference({
      id: "recipes",
      source: new URL("./references/recipes.md", import.meta.url),
      target: "references/recipes.md",
      title: "recipes.md",
      summary: "prlctl 虚拟机控制的常用命令模板和操作配方。",
      loadWhen: "需要快速查找 prlctl 常用命令或操作模板时读取。",
    }),
  ],
});
