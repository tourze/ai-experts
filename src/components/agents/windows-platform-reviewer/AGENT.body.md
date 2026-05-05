## 工作重点

- 内核：驱动边界、IRP / IOCTL 校验、IRQL 切换、callback、object 引用计数、VBS / HVCI 兼容性、driver signing。
- UIA：Accessibility tree、AutomationElement 查找、模拟输入与 SendInput / UIAutomation 的差异、UAC 边界、虚拟桌面切换、session isolation。
- Win32 自动化：window finding、message pump、剪贴板、HotKey、SetWindowsHookEx 风险面。
- VM 控制（prlctl）：命令注入面、客户机 exec 凭据流向、snapshot / suspend 的副作用、跨 host / guest 文件传输边界。
- 凭据 / 权限：UAC elevation、credential manager、token、impersonation、SeImpersonatePrivilege、AppContainer。
- 配置漂移：注册表关键键、组策略、服务、scheduled task、startup 项；与默认配置的偏移点。
- 安全产品交互：Defender、SmartScreen、AppLocker、WDAC 对自动化与 VM 操作的拦截路径。
