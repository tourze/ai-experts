---
name: windows-kernel-security
description: 当用户分析或审计 Windows 内核对象、驱动边界或安全机制时使用；英文触发词 Windows kernel / PatchGuard / VBS / HVCI / IOCTL。
---

# windows-kernel-security

## 适用场景

- 需要分析 Windows 驱动、设备对象、IOCTL、回调注册和对象生命周期。
- 需要区分普通 bug、PatchGuard / DSE / HVCI 约束、以及检测面之间的边界。
- 需要审查 `EPROCESS`、`ETHREAD`、`MMVAD`、`DRIVER_OBJECT`、`IRP` 等内核结构如何被读写。
- 需要在实验环境里追踪 `PsSetCreateProcessNotifyRoutine*`、`ObRegisterCallbacks`、`CmRegisterCallbackEx`、`FltRegisterFilter` 等关键入口。
- 需要先在虚拟机里建立快照和回滚路径时，配合 [prlctl-vm-control](../prlctl-vm-control/SKILL.md)；如果问题其实属于桌面自动化或输入注入边界，转到 [windows-ui-automation](../windows-ui-automation/SKILL.md)。

## 核心约束

- 先做静态分析、日志与符号级证据采集，再做实验；不要在真实主机上盲改驱动或内核状态。
- 任何问题都拆成五层：入口、权限边界、状态拥有者、副作用、检测面；不要只盯最终崩溃点。
- 优先梳理用户态输入如何进入 IOCTL，再进入驱动，再触达内核对象或内存写入点。
- 区分“研究概念”与“可执行变更”：PatchGuard、DSE、HVCI、VBS 先解释约束，再决定是否需要实验复现。
- 如果实验需要破坏性动作、重启、回滚或快照切换，先确认虚拟机基线和回滚路径。

## 代码模式

### 模式 1：先从 IOCTL 和设备边界反查信任面

```bash
rg -n "IRP_MJ_DEVICE_CONTROL|CTL_CODE|METHOD_(BUFFERED|IN_DIRECT|OUT_DIRECT|NEITHER)" .
rg -n "DeviceIoControl|CreateFile[A-Z]*\\(|Zw(DeviceIoControlFile|CreateFile)" .
```

### 模式 2：从回调注册点回溯对象生命周期

```bash
rg -n "PsSetCreateProcessNotifyRoutine(Ex|Ex2)?|PsSetLoadImageNotifyRoutine(Ex)?|ObRegisterCallbacks|CmRegisterCallbackEx|FltRegisterFilter" .
rg -n "EPROCESS|ETHREAD|MMVAD|DRIVER_OBJECT|DEVICE_OBJECT|IRP" .
```

## 检查清单

- 入口是否清楚：谁调用驱动、如何构造 IOCTL、参数在哪一层首次变成可信数据。
- 权限边界是否清楚：调用方令牌、设备 ACL、`METHOD_NEITHER` 指针、回调注册权限是否匹配。
- 副作用是否清楚：是否写入全局表、对象回调、进程列表、VAD、或 PatchGuard 关注区域。
- 约束是否清楚：当前代码是否受 DSE、HVCI、VBS、PatchGuard 或 Secure Boot 影响。
- 复现路径是否清楚：是否已经在实验环境中准备好符号、日志、快照和回滚方案。

## 反模式

### FAIL: 真机无快照实验

```
"就改一行驱动代码试试"
→ 蓝屏 / 无法启动 / 丢数据
```

### PASS: VM + 快照

```bash
# 先建 VM，快照 "clean-baseline"
prlctl snapshot <uuid> --name clean-baseline
# 实验中 → 若崩 → snapshot-switch 回滚
# 任何驱动类改动都在 VM 中验证，绝不在真机
```

### FAIL: 四层概念混为一谈

```
"加 PatchGuard / DSE / HVCI / VBS bypass"
→ 四种机制混着说 → 修错层
```

### PASS: 分层识别

```
DSE (Driver Signature Enforcement)：驱动签名
HVCI (Hypervisor Code Integrity)：VBS 内存保护
PatchGuard：内核补丁检测
VBS (Virtualization-Based Security)：容器级隔离
→ 先明确当前问题属于哪一层，再选方案
```
