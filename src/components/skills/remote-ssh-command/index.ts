import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, remoteSshCommandInstallSshpass, remoteSshCommandSshExec } from "../../procedures/index";

export const remoteSshCommandSkill = defineSkill({
  id: "remote-ssh-command",
  fullName: "远端机器运维",
  description: "当用户需要通过 SSH 在远端机器执行日常运维命令、写入主机 JSON 凭据或审计执行历史时使用。",
  useCases: [
    "用户给出远端主机、用户名、密码，并要求在机器上执行运维命令。",
    "需要把 SSH 连接信息保存为 `~/.host/<host>.json` 以便长期复用。",
    "需要查看 `~/.host/<host>.history` 里的命令执行审计记录。",
  ],
  constraints: [
    "第一版只支持密码认证：`auth.type` 必须是 `password`。",
    "主机配置只放在 `~/.host/`；procedure 只接受一个 JSON 文件路径参数。",
    "远端命令从 `stdin` 读取完整文本，不通过 CLI 参数传命令或密码。",
    "用户明确给出的远端命令可执行；模型生成的远端命令必须先回显并获得用户确认。",
    "安装 `sshpass` 会修改本机环境；只有用户明确确认安装方式和影响范围后才传 `--yes`。",
    "history 使用 JSONL 追加写入，只记录命令、时间、退出码、耗时和超时状态，不记录远端输出。",
    "procedure 输出完整远端 `stdout/stderr`，不做截断。",
  ],
  checklist: [
    "是否确认 JSON 文件在 `~/.host/` 下，且只使用密码认证。",
    "是否确认远端命令来自用户原文，或已把模型生成命令回显给用户并获得确认。",
    "是否把远端命令放在 `stdin`，避免本地 shell 提前展开。",
    "是否查看 procedure 退出码；本地退出码等于远端命令退出码，连接失败、配置错误、超时均为非零。",
    "是否按需查看 `~/.host/<host>.history`，确认执行命令、退出码和耗时。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "把密码或命令拼进 CLI 参数",
      pass: "配置走 JSON，命令走 stdin",
    }),
  ],
  invocation: InvocationPolicy.ExplicitOnly,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先读取或创建 `~/.host/<host>.json`，字段包含 `host`、`port`、`user`、`timeoutSeconds` 和 `auth.type=password`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "如本机缺少 `sshpass`，先让用户确认本机安装方式，再调用安装 procedure；不要把密码或远端命令放进 CLI 参数。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "确认远端命令来源后，经 stdin 传给 `remote-ssh-command-ssh-exec`，例如用 `printf '%s\\n' '<command>' | procedure ... ~/.host/<host>.json` 的形态执行。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "根据本地退出码判断远端命令结果；需要审计时读取 `~/.host/<host>.history` 的 JSONL 记录，但不要把远端输出写入 history。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "主机 JSON 配置路径、认证类型、超时设置、将要执行的远端命令来源和确认状态。",
      "远端 stdout/stderr、退出码、耗时和连接/配置/超时错误分类。",
      "必要时给出 history JSONL 路径与最近执行摘要，不泄露密码或敏感远端输出。",
    ],
  }),
  procedures: [
    procedureUse(remoteSshCommandInstallSshpass, {
      label: "安装 sshpass",
      when: "本地缺少 sshpass 工具时。",
      reason: "自动检测操作系统和包管理器，并在确认后安装 sshpass，避免手写多条安装命令。",
    }),
    procedureUse(remoteSshCommandSshExec, {
      label: "远端命令执行",
      when: "需要通过 SSH 在远端机器执行运维命令时。",
      reason: "统一管理主机凭据和执行审计，避免每次手写 ssh 命令和拼接密码参数。",
    }),
  ],
});
