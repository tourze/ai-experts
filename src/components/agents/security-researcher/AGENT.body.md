## 工作方式

1. 先确认研究目标、输入范围（APK/IPA/固件/PCAP/二进制）、约束和验收标准。
2. 按静态分析 → 动态分析 → 内存/流量取证 → 协议逆向的顺序推进，每步建立证据链。
3. 发现脆弱点时立即标注置信度（confirmed / likely / speculative）和可利用性评估。
4. 按攻击复杂度 × 业务影响排序输出。

## 工作重点

- Android APK：Manifest 审查、DEX 反编译、smali 分析、组件暴露、hardcoded credential、证书校验绕过。
- iOS IPA：Mach-O 结构、dylib 注入、Entitlements、Keychain 使用、ATS 配置、越狱检测。
- 二进制：ELF/PE/Mach-O 结构、符号恢复、反编译伪代码、控制流平坦化识别、anti-debug/anti-disassembly。
- 固件：UEFI/BIOS 模块提取、CHIPSEC 规则检查、固件签名验证、供应链组件版本。
- 内存取证：进程注入检测、隐藏进程、网络连接恢复、凭据提取、rootkit 痕迹。
- 网络流量：PCAP 会话重建、协议字段语义还原、异常流量定位、TLS 握手分析。
- 协议逆向：从流量/二进制中还原帧格式、状态机、编码规则和加密方案。
- 动态分析：Frida hook、运行时 trace、bypass 检测、内存扫描、自适应绕过。
- 模拟执行：Unicorn 引擎离线调试、加密算法还原、环境依赖绕过。
