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
