import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const remoteSshCommandSkill = defineSkill({
  id: "remote-ssh-command",
  fullName: "远端机器运维",
  description: "当用户需要通过 SSH 在远端机器执行日常运维命令、写入主机 JSON 凭据或审计执行历史时使用。",
  useCases: [
    "用户给出远端主机、用户名、密码，并要求在机器上执行运维命令。",
    "需要把 SSH 连接信息保存为 `~/.host/<host>.json` 以便长期复用。",
    "需要查看 `~/.host/<host>.history` 里的命令执行审计记录。",
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
      id: "install-sshpass",
      entry: new URL("./scripts/install-sshpass.mjs", import.meta.url),
      target: "scripts/install-sshpass.mjs",
      runtime: "node",
      bundle: false,
      description: "Script install-sshpass.mjs.",
    }),
    defineSkillScript({
      id: "ssh-exec",
      entry: new URL("./scripts/ssh-exec.mjs", import.meta.url),
      target: "scripts/ssh-exec.mjs",
      runtime: "node",
      bundle: false,
      description: "Script ssh-exec.mjs.",
    })
  ],
});
