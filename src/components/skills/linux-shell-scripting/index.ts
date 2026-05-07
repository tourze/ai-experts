import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { networkTroubleshooterSkill } from "../network-troubleshooter/index";
import { systemDiagnosticsSkill } from "../system-diagnostics/index";

export const linuxShellScriptingSkill = defineSkill({
  id: "linux-shell-scripting",
  fullName: "Linux Shell 脚本",
  description: "当用户要编写 Bash/Zsh 自动化、运维脚本、巡检脚本、备份脚本或命令行工具时使用。",
  useCases: [
    "用户要写 Bash 自动化、巡检、备份、发布、清理、定时任务或包装 CLI。",
    "脚本需要参数校验、依赖检查、日志、清理、超时、重试或 dry-run。",
  ],
  constraints: [
    "默认使用 `#!/usr/bin/env bash` 与 `set -euo pipefail`；仅在明确需要 POSIX `sh` 时降级。",
    "任何删除、覆盖、远程执行动作都必须先校验参数并输出计划。",
    "禁止把秘密硬编码进脚本；用环境变量、参数或凭据文件。",
    "产出的脚本必须具备 `usage`、依赖检查、日志函数和失败返回码。",
  ],
  checklist: [
    "shebang、`set -euo pipefail`、参数校验、依赖校验齐全。",
    "所有变量都被双引号包裹，路径与空格安全。",
    "使用 `trap` 处理临时文件、锁文件或后台进程清理。",
    "失败时返回非零 exit code，成功路径可复验。",
    "长循环、网络重试、并发任务包含超时与限次控制。",
  ],
  relatedSkills: [
    {
      get id() {
        return networkTroubleshooterSkill.id;
      },
      reason: "脚本涉及网络探测、连通性验证、DNS/TLS 或重试策略时联动。",
    },
    {
      get id() {
        return systemDiagnosticsSkill.id;
      },
      reason: "需要系统快照、诊断输出模板或主机状态采集时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "缺 set 严格模式",
      pass: "严格模式 + 引号",
    }),
    defineAntiPattern({
      fail: "for f in $(ls ...)",
      pass: "glob + 引号",
    }),
    defineAntiPattern({
      fail: "破坏命令无 dry-run",
      pass: "--dry-run 默认",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "默认使用 `#!/usr/bin/env bash` 和 `set -euo pipefail`；仅在明确需要 POSIX sh 时降级。",
      "先定义 usage、参数校验、require_cmd、日志函数、失败返回码和 dry-run 行为。",
      "所有变量和路径加双引号，避免 for f in $(ls ...)；破坏性删除/覆盖/远程执行必须先输出计划。",
      "临时文件、锁文件和后台进程用 trap 清理；长循环、网络重试和并发任务设置超时与限次。",
      "涉及系统快照联动 system-diagnostics，涉及网络探测或重试联动 network-troubleshooter。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "可执行脚本结构：shebang、严格模式、usage、参数校验、依赖检查、日志、trap 和 exit code。",
      "dry-run 计划、破坏性动作保护、路径/空格安全和秘密处理方式。",
      "超时、重试、并发、临时文件清理和系统/网络诊断联动说明。",
    ],
  }),
  tools: [],
});
