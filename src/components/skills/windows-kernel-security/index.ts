import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { prlctlVmControlSkill } from "../prlctl-vm-control/index";
import { windowsUiAutomationSkill } from "../windows-ui-automation/index";

export const windowsKernelSecuritySkill = defineSkill({
  id: "windows-kernel-security",
  fullName: "windows-kernel-security",
  description: "当用户分析或审计 Windows 内核对象、驱动边界、PatchGuard、VBS、HVCI 或 IOCTL 时使用。",
  useCases: [
    "需要分析 Windows 驱动、设备对象、IOCTL、回调注册和对象生命周期。",
    "需要区分普通 bug、PatchGuard / DSE / HVCI 约束、以及检测面之间的边界。",
    "需要审查 `EPROCESS`、`ETHREAD`、`MMVAD`、`DRIVER_OBJECT`、`IRP` 等内核结构如何被读写。",
    "需要在实验环境里追踪 `PsSetCreateProcessNotifyRoutine*`、`ObRegisterCallbacks`、`CmRegisterCallbackEx`、`FltRegisterFilter` 等关键入口。",
    "需要先在虚拟机里建立快照和回滚路径时，配合 `prlctl-vm-control`；如果问题其实属于桌面自动化或输入注入边界，转到 `windows-ui-automation`。",
  ],
  constraints: [
    "先做静态分析、日志与符号级证据采集，再做实验；不要在真实主机上盲改驱动或内核状态。",
    "任何问题都拆成五层：入口、权限边界、状态拥有者、副作用、检测面；不要只盯最终崩溃点。",
    "优先梳理用户态输入如何进入 IOCTL，再进入驱动，再触达内核对象或内存写入点。",
    "区分“研究概念”与“可执行变更”：PatchGuard、DSE、HVCI、VBS 先解释约束，再决定是否需要实验复现。",
    "如果实验需要破坏性动作、重启、回滚或快照切换，先确认虚拟机基线和回滚路径。",
  ],
  checklist: [
    "入口是否清楚：谁调用驱动、如何构造 IOCTL、参数在哪一层首次变成可信数据。",
    "权限边界是否清楚：调用方令牌、设备 ACL、`METHOD_NEITHER` 指针、回调注册权限是否匹配。",
    "副作用是否清楚：是否写入全局表、对象回调、进程列表、VAD、或 PatchGuard 关注区域。",
    "约束是否清楚：当前代码是否受 DSE、HVCI、VBS、PatchGuard 或 Secure Boot 影响。",
    "复现路径是否清楚：是否已经在实验环境中准备好符号、日志、快照和回滚方案。",
  ],
  relatedSkills: [
    {
      get id() {
        return windowsUiAutomationSkill.id;
      },
      reason: "需要先在虚拟机里建立快照和回滚路径时，配合 `prlctl-vm-control`；如果问题其实属于桌面自动化或输入注入边界，转到 `windows-ui-automation`。",
    },
    {
      get id() {
        return prlctlVmControlSkill.id;
      },
      reason: "需要先在虚拟机里建立快照和回滚路径时，配合 `prlctl-vm-control`；如果问题其实属于桌面自动化或输入注入边界，转到 `windows-ui-automation`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
