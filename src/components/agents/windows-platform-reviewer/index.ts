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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: windowsKernelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: windowsUiAutomationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: prlctlVmControlSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
