import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const windowsKernelSecuritySkill = defineSkill({
  id: "windows-kernel-security",
  fullName: "windows-kernel-security",
  description: "当用户分析或审计 Windows 内核对象、驱动边界、PatchGuard、VBS、HVCI 或 IOCTL 时使用。",
  useCases: [
    "需要分析 Windows 驱动、设备对象、IOCTL、回调注册和对象生命周期。",
    "需要区分普通 bug、PatchGuard / DSE / HVCI 约束、以及检测面之间的边界。",
    "需要审查 `EPROCESS`、`ETHREAD`、`MMVAD`、`DRIVER_OBJECT`、`IRP` 等内核结构如何被读写。",
    "需要在实验环境里追踪 `PsSetCreateProcessNotifyRoutine*`、`ObRegisterCallbacks`、`CmRegisterCallbackEx`、`FltRegisterFilter` 等关键入口。",
    "需要先在虚拟机里建立快照和回滚路径时，配合 [prlctl-vm-control](../prlctl-vm-control/SKILL.md)；如果问题其实属于桌面自动化或输入注入边界，转到 [windows-ui-automation](../windows-ui-automation/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
