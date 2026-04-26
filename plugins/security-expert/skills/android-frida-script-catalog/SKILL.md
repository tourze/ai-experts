---
name: android-frida-script-catalog
description: "当需要为 Android 动态分析选择或组合 Frida 脚本族、安排加载顺序、规划 pinning/root/RASP、IPC/WebView/网络/存储、Keystore/crypto、JNI/native 或运行时 dump 验证时使用。"
---

# Android Frida 脚本目录

## 适用场景
- 已有 Android 动态分析假设，需要选择合适的 Frida 脚本族或加载顺序。
- 用户提到 SSL pinning bypass、root detection、RASP、anti-Frida、IPC logger、WebView monitor、network interceptor、crypto trace、Keystore inspector、JNI/native hook、DEX dump。
- 需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 配合：本 skill 负责选型和组合，具体 hook 编写仍要静态定位后执行。
- 需要作为 [android-apk-audit](../android-apk-audit/SKILL.md) 的动态验证下钻。

## 核心约束
- 脚本目录是选型指南，不代表本插件随包提供这些脚本文件；执行前先确认脚本路径真实存在。
- 先静态定位目标类、方法、native 库或行为，再加载脚本；不要把通用 bypass 成功加载当成漏洞证据。
- 默认 observe-first：先日志与监控，再修改返回值或参数。
- 多脚本组合时控制噪声；一次只验证一个假设或一组强相关假设。
- 记录 Frida tools 与 frida-server 版本、设备 ABI、spawn/attach 模式和目标包名。

## 选型表

| 目标 | 首选脚本族 | 升级方向 |
| --- | --- | --- |
| SSL pinning / TLS | `ssl-pinning-bypass`, `network-security-bypass` | 针对 OkHttp/TrustManager/native SSL 定制 hook |
| root / emulator / debug 检测 | `root-detection-bypass` | `native-root-detection-probe`, RASP 专用 hook |
| anti-Frida / RASP | `anti-frida-bypass`, `rasp-bypass` | procfs/string/native anti-debug 定点 hook |
| IPC / deep link | `intent-logger`, `ipc-abuse-helper` | `method-tracer` 跟踪 router/dispatcher |
| WebView | `webview-monitor`, `webview-debug` | hook `WebViewClient`, JS bridge, SSL error |
| HTTP/API | `network-interceptor` | OkHttp interceptor、Retrofit、WebSocket 定点 hook |
| 文件/存储 | `android-file-access-monitor`, `shared-prefs-dumper` | Provider/openFile、SQLite、libc open/read/write |
| token/JWT | `jwt-token-monitor` | header/cookie/storage/source-to-sink trace |
| Keystore/biometric | `keystore-inspector`, `biometric-bypass` | CryptoObject 与 auth-bound key 验证 |
| crypto | `crypto-intercept` | `Cipher`, `Mac`, `MessageDigest`, `SecretKeySpec` 定点 trace |
| JNI/native | `jni-tracer`, `native-hook` | by-offset hook、Ghidra/IDA 交叉验证 |
| 加壳/动态 DEX | `dexdump`, `packer-unpacker` | dump 后用 [jadx](../jadx/SKILL.md) 反编译 |

## 加载顺序

```
1. bypass 层
   ├─ SSL / root / anti-Frida / RASP
   └─ 目标：让应用稳定进入待测路径
        ↓
2. observe 层
   ├─ IPC / WebView / network / file / crypto / token
   └─ 目标：收集路径证据，不改业务行为
        ↓
3. deep-dive 层
   ├─ method trace / JNI / native / by-offset hook
   └─ 目标：验证具体 source-to-sink 或保护逻辑
```

示例命令使用占位脚本路径：

```bash
frida -U -f com.target.app -l scripts/ssl-pinning-bypass.js
frida -U -f com.target.app -l scripts/anti-frida-bypass.js -l scripts/intent-logger.js
frida -U com.target.app -l scripts/network-interceptor.js
```

## 决策流程
1. 从静态分析得到假设：类名、方法签名、native 库、Manifest 入口或 API 行为。
2. 选择最小脚本族：优先能回答该假设的单一脚本。
3. 选择模式：启动早期保护用 spawn；用户操作后才触发的行为用 attach。
4. 运行后保存日志：命令、脚本 hash、设备、版本、时间点、触发动作。
5. 只把可复现日志或行为变化写入报告；脚本无输出也要记录为未确认。

## 常见组合

| 场景 | 组合 |
| --- | --- |
| 抓 HTTPS 登录流量 | SSL bypass + network interceptor |
| 验证 exported deep link | intent logger + method tracer |
| 查明本地文件泄露 | IPC helper + file access monitor |
| 分析 Flutter/RN bridge | framework channel hook + network/crypto monitor |
| native RASP 崩溃 | anti-Frida/root bypass + native-root probe + logcat |
| 加壳后看真实 DEX | packer detector + dexdump + jadx |

## 证据要求
- bypass 类脚本：必须证明原失败路径变为可达，或记录到具体被 hook 的检测点。
- monitor 类脚本：必须给出时间线、用户动作、输出日志与对应代码位置。
- native hook：必须给出模块名、导出名或偏移、ABI 和符号来源。
- DEX dump：必须记录 dump 文件 hash，并用 JADX 验证业务代码是否新增。

## 反模式

### FAIL: 一次加载所有脚本

```bash
frida -U -f com.target -l ssl.js -l root.js -l ipc.js -l file.js -l crypto.js -l native.js
```

输出噪声过大，无法证明哪个脚本改变了行为。

### PASS: 假设驱动加载

```bash
rg -n 'CertificatePinner|X509TrustManager' work/jadx/sources/com/target
frida -U -f com.target -l scripts/ssl-pinning-bypass.js
```

先定位保护实现，再用最小脚本验证；失败时升级到定点 hook。
