import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
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
    "主机配置只放在 `~/.host/`；脚本只接受一个 JSON 文件路径参数。",
    "远端命令从 `stdin` 读取完整文本，不通过 CLI 参数传命令或密码。",
    "用户命令和模型生成命令都可直接执行，不做二次确认。",
    "history 使用 JSONL 追加写入，只记录命令、时间、退出码、耗时和超时状态，不记录远端输出。",
    "脚本输出完整远端 `stdout/stderr`，不做截断。",
  ],
  checklist: [
    "是否确认 JSON 文件在 `~/.host/` 下，且只使用密码认证。",
    "是否把远端命令放在 `stdin`，避免本地 shell 提前展开。",
    "是否查看脚本退出码；本地退出码等于远端命令退出码，连接失败、配置错误、超时均为非零。",
    "是否按需查看 `~/.host/<host>.history`，确认执行命令、退出码和耗时。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "把密码或命令拼进 CLI 参数",
      pass: "配置走 JSON，命令走 stdin",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  procedures: [
    procedureUse(remoteSshCommandInstallSshpass),
    procedureUse(remoteSshCommandSshExec),
  ],
});
