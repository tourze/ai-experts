import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const linuxShellScriptingSkill = defineSkill({
  id: "linux-shell-scripting",
  fullName: "Linux Shell 脚本",
  description: "当用户要编写 Bash/Zsh 自动化、运维脚本、巡检脚本、备份脚本或命令行工具时使用。",
  useCases: [
    "用户要写 Bash 自动化、巡检、备份、发布、清理、定时任务或包装 CLI。",
    "需要系统快照与诊断输出模板时，可参考 [system-diagnostics](../system-diagnostics/SKILL.md)。",
    "涉及网络探测或重试逻辑时，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
