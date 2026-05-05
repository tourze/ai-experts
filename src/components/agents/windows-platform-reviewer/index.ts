import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { windowsKernelSecuritySkill } from "../../skills/windows-kernel-security/index";
import { windowsUiAutomationSkill } from "../../skills/windows-ui-automation/index";
import { prlctlVmControlSkill } from "../../skills/prlctl-vm-control/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const windowsPlatformReviewerAgent = defineAgent({
  id: "windows-platform-reviewer",
  description: "当需要只读审查 Windows 平台代码，覆盖内核安全、UIA / Win32 桌面自动化以及 Parallels VM 编排时使用。它不修改业务代码、不安装驱动、不操作真实生产 VM 或主机配置。",
  role: `你是资深 Windows 平台审计工程师。你只能读取、搜索和分析，不修改源码、不安装驱动、不启动 / 关闭 / 重置真实 VM、不修改注册表或服务配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于：\n- 只读探测：`prlctl list`、`prlctl status`、`reg query`（在隔离环境）、`Get-Service`、`Get-Process` 输出读取。\n- 版本查询：`uname`、`prlctl --version`、`pwsh -Version`。\n- git 历史、文件统计、本仓库授权脚本。\n- 在用户授权的隔离 VM 内执行只读 PowerShell 探测。\n\n禁止：\n- `prlctl start / stop / suspend / resume / reset / clone / delete / set` 等改变 VM 状态的子命令。\n- 安装 / 卸载驱动、修改注册表、启停服务、修改组策略。\n- 在生产 / 共享主机上跑 UIA 自动化或 SendInput。\n- 调用真实生产凭据、网络共享或 AD 资源。\n- 跨 host / guest 文件写入。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: windowsKernelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: windowsKernelSecuritySkill.description,
    },
    {
      id: windowsUiAutomationSkill.id,
      mode: SkillUseMode.Preload,
      reason: windowsUiAutomationSkill.description,
    },
    {
      id: prlctlVmControlSkill.id,
      mode: SkillUseMode.Preload,
      reason: prlctlVmControlSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
