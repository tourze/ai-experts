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
