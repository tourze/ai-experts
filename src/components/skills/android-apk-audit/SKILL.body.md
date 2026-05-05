## 适用场景
- 用户提供 APK、DEX、smali、JADX 输出或 APKTool 解包目录，需要做授权安全审计。
- 用户要求 Android 移动渗透测试、APK 漏洞评估、OWASP MASVS/MASTG 映射或 CVSS 报告。
- 用户需要串联 [apktool](references/apktool.md)、[jadx](references/jadx.md)、[frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 和 [dex-dumper](references/dex-dumper.md)。
- 用户提到 exported component、Intent injection、deep link abuse、WebView、SSL pinning、root/RASP 检测、硬编码密钥或 APK 重打包。
- Manifest 配置下钻使用 [android-manifest-security](references/android-manifest-security.md)；Intent/deep link 下钻使用 [intent-deeplink-abuse](../ethical-hacking-methodology/SKILL.md)；Frida 脚本选型使用 [android-frida-script-catalog](references/android-frida-script-catalog.md)。

## 核心约束
- 只在用户确认授权的目标上执行测试；目标和包名不清时先收敛范围。
- 保留原始 APK、签名、版本号和 SHA-256；所有输出写入独立工作目录。
- 禁止把裸 grep 命中直接写成漏洞；必须回到调用链、组件入口或运行时证据。
- 搜索优先限制在应用命名空间，第三方库命中只作为线索，避免库噪声误报。
- 静态证据不闭合时标为“需要动态确认”，不要用业务侧猜测补齐证据。
- 每个有效发现必须给出攻击入口、传播路径、危险 sink、PoC 和修复建议。

## 执行流程

### 0. 授权、基线与工具检查
记录测试目标、授权边界、APK 哈希、包名、版本、minSdk/targetSdk。确认 `apktool`、`jadx`、`aapt2`、`adb`、`apksigner`、`zipalign`、`frida` 可用；缺工具时报告缺口，不伪造动态验证结果。

```bash
shasum -a 256 app.apk  # Linux 也可用 sha256sum app.apk
aapt2 dump badging app.apk
apktool d app.apk -o work/decoded
jadx -d work/jadx app.apk
```

### 1. 框架与攻击面映射
先识别标准 Android、React Native、Flutter、Cordova/Ionic、Unity、Xamarin、native-heavy 或加壳应用。随后从 `AndroidManifest.xml` 建攻击面表：Activity、Service、Receiver、Provider、permission、intent-filter、deep link、FileProvider、network security config。

如果问题集中在 Manifest 配置和 exported 组件，切到 [android-manifest-security](references/android-manifest-security.md)。

### 2. 定向静态审计
围绕入口到 sink 做定向搜索，而不是全仓库关键词轰炸。

| 类别 | 入口或模式 | 需要追踪的 sink |
| --- | --- | --- |
| IPC / deep link | `getIntent()`, `onNewIntent()`, URI 参数 | `startActivity`, `sendBroadcast`, file/SQL/WebView/native |
| WebView | `addJavascriptInterface`, `loadUrl`, `evaluateJavascript` | 任意 JS、file URL、未受信域名 |
| 存储与密钥 | `SharedPreferences`, Keystore, strings/resources | 明文凭据、弱保护、可备份数据 |
| 网络与 TLS | `TrustManager`, `HostnameVerifier`, pinning 配置 | 信任所有证书、明文、pinning 可绕过 |
| 加密 | `Cipher`, `MessageDigest`, `Mac`, hardcoded IV/key | ECB、MD5/SHA1、固定密钥或 IV |
| Native / 反逆向 | `System.loadLibrary`, JNI, ptrace, root check | native sink、动态加载、RASP 退出路径 |

### 3. 数据流与置信度
对每条可疑路径标注 source、传播节点、sink、保护条件和证据类型。

| 置信度 | 条件 | 处理 |
| --- | --- | --- |
| Confirmed | 静态调用链闭合且 PoC 或动态证据验证 | 写入正式发现 |
| Likely | 路径清晰但有小范围反编译或分支缺口 | 写入发现并说明缺口 |
| Needs Dynamic Confirmation | 反射、混淆、native、加壳或运行时配置遮挡关键路径 | 列入待验证项 |

### 4. 动态验证
只有静态阶段提出了明确假设后再使用 Frida/Objection/ADB。优先验证最能改变风险等级的路径：组件可达性、SSL pinning、root/RASP 检测、WebView 域控制、Keystore 使用、native 边界和敏感数据出站。

Intent/deep link 复现切到 [intent-deeplink-abuse](../ethical-hacking-methodology/SKILL.md)；Frida 脚本组合切到 [android-frida-script-catalog](references/android-frida-script-catalog.md)。

```bash
adb shell am start -n com.example/.ExportedActivity -d 'scheme://host/path?x=1'
frida -U -f com.example -l hook.js
adb logcat | rg 'com.example|SecurityException|SSL|pinning'
```

### 5. 报告与复核
报告按严重性排序，去重同一根因。每个发现包含：标题、严重性、CVSS、CWE/OWASP Mobile Top 10 或 MASVS/MASTG 映射、证据、PoC、影响、修复、置信度、验证状态。

结尾必须写覆盖声明：

```md
Coverage:
- Static analysis: complete / partial
- Dynamic analysis: complete / partial / not performed
- Scope: <package namespace>
- Framework: <detected framework>
- Obfuscation/packing: <none|proguard|dexguard|packer|unknown>
- Remaining limitations: <items>
```

## 检查清单
- Manifest 与资源层审计是否覆盖 exported、permission、deep link、FileProvider、backup、debuggable、network security config。
- JADX 与 smali 是否交叉验证关键逻辑，避免反编译伪代码误导。
- 所有 grep 命中是否回到调用链，第三方库噪声是否排除。
- 动态脚本是否围绕静态假设编写，而不是盲跑通用 bypass。
- 报告是否区分已确认、可能存在和需要动态确认。

## 反模式

### FAIL: 字符串命中即报

```bash
rg -i "token|secret|password" work/jadx
# 命中就报告硬编码密钥
```

问题：测试代码、第三方库、无效占位符和运行时未使用常量都会制造误报。

### PASS: 命中后闭合证据链

```bash
rg -n "API_KEY" work/jadx/sources/com/example
rg -n "BuildConfig|Interceptor|Authorization" work/jadx/sources/com/example
```

回到定义、条件分支、调用点和网络层使用位置；无法证明运行时使用时标为需要动态确认。

### FAIL: 盲跑通用 Frida 脚本

```bash
frida -U -f com.example -l universal-ssl-bypass.js
```

问题：脚本成功加载不等于 pinning 已绕过，也不能证明漏洞存在。

### PASS: 静态定位后精准 hook

```bash
rg -n "CertificatePinner|TrustManager|HostnameVerifier" work/jadx/sources/com/example
```

确认具体类、方法签名和调用路径后再写 hook，并用代理流量或日志证明行为变化。
