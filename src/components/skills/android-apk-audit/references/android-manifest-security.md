
# Android Manifest 安全审计

## 适用场景
- 已有 APKTool 解包目录，需要审计 `AndroidManifest.xml` 与 `res/xml/` 安全配置。
- 需要判断 exported Activity/Service/Receiver/Provider 是否构成攻击面。
- 需要检查 `debuggable`、`allowBackup`、cleartext、Network Security Config、FileProvider、custom permission、taskAffinity、launchMode。
- 需要作为 [android-apk-audit](../android-apk-audit/SKILL.md) 的 Manifest 下钻阶段。

## 核心约束
- Manifest 命中只是入口线索，不能单独定性漏洞；必须回到组件代码或资源配置验证影响。
- 区分显式 exported 与隐式 exported：旧 API 上带 `intent-filter` 的组件可能外部可达。
- Provider 风险单独处理：`exported`、`readPermission`、`writePermission`、`grantUriPermissions` 和 path XML 要一起看。
- Network Security Config 必须看实际 XML；Manifest 上有引用不代表 TLS 配置安全。
- Android 12+、14+ 行为变化影响可达性，报告中写明目标 `targetSdkVersion` 和测试设备 API。

## 审计流程

### 1. 建立 manifest 基线

```bash
shasum -a 256 app.apk
aapt2 dump badging app.apk
apktool d app.apk -o work/decoded
rg -n 'package=|platformBuildVersion|uses-sdk|debuggable|allowBackup|usesCleartextTraffic' work/decoded/AndroidManifest.xml
```

记录包名、版本、minSdk、targetSdk、签名摘要和 Manifest 来源路径。

### 2. 组件攻击面表

| 组件 | 重点字段 | 代码回看点 |
| --- | --- | --- |
| Activity | `exported`, `intent-filter`, `launchMode`, `taskAffinity` | `onCreate`, `onNewIntent`, URI/extras 校验 |
| Service | `exported`, `permission`, `foregroundServiceType` | `onStartCommand`, `onBind`, command 参数 |
| Receiver | `exported`, `permission`, action | `onReceive`, 广播来源与 DoS 影响 |
| Provider | `exported`, `authorities`, `readPermission`, `writePermission`, `grantUriPermissions` | `query`, `openFile`, `call`, path XML |

```bash
rg -n '<(activity|service|receiver|provider)\b|android:exported|intent-filter|android:permission|readPermission|writePermission|grantUriPermissions' work/decoded/AndroidManifest.xml
rg -n 'FileProvider|androidx.core.content.FileProvider|provider_paths|paths' work/decoded/AndroidManifest.xml work/decoded/res/xml
```

### 3. 高风险配置检查

| 配置 | 风险 | 验证 |
| --- | --- | --- |
| `android:debuggable="true"` | ADB attach、内存读取、调试注入 | 确认是否 release 包 |
| `android:allowBackup="true"` | 应用数据可被备份提取 | 看 `fullBackupContent` 排除规则 |
| `usesCleartextTraffic="true"` | 明文传输与 MITM | 结合 NSC 与实际网络栈 |
| custom permission 缺 `protectionLevel` | 默认 normal，过宽授权 | 确认组件是否真的受该权限保护 |
| broad FileProvider paths | 沙箱文件外泄 | 看 `res/xml/*paths.xml` 与 `openFile` 路径 |
| `taskAffinity` / `singleTask` | task hijacking、`onNewIntent` 绕过 | 回看 Activity intent 处理 |

### 4. Network Security Config

```bash
rg -n 'networkSecurityConfig|usesCleartextTraffic' work/decoded/AndroidManifest.xml
rg -n 'cleartextTrafficPermitted|certificates src="user"|debug-overrides|pin-set|domain-config' work/decoded/res/xml
```

报告时区分：
- release 是否信任 user CA；
- 是否允许 cleartext；
- 是否存在 pinning 与 backup pin；
- debug override 是否进入 release 包。

### 5. 版本相关判断

| API | 检查点 | 处理 |
| --- | --- | --- |
| 31+ | 带 `intent-filter` 的组件必须显式 `exported` | 构建错误或迁移遗漏 |
| 31+ | `PendingIntent` mutability 必须明确 | 下钻到 [intent-deeplink-abuse](../intent-deeplink-abuse/SKILL.md) |
| 33+ | 媒体/通知权限拆分 | 判断是否过度申请 |
| 34+ | implicit intent 与 exported receiver 更严格 | 动态 PoC 要标注 API 版本 |

## PoC 骨架

```bash
adb shell am start -n com.target/.ExportedActivity
adb shell am start -a android.intent.action.VIEW -d 'scheme://host/path?x=1'
adb shell am startservice -n com.target/.ExportedService --es command test
adb shell am broadcast -n com.target/.ExportedReceiver -a com.target.ACTION --es data test
adb shell content query --uri content://com.target.provider/table
```

## 报告规则
- “exported without permission” 只有在组件处理敏感动作或数据时才升级为漏洞；否则写为攻击面或加固建议。
- Provider 漏洞必须说明读/写能力、URI、权限状态和可访问数据类型。
- Deep link 发现必须说明 scheme/host/path、参数来源、代码 sink 和验证命令。
- NSC 发现必须说明 release/debug 上下文；不要把 debug-only override 误报为生产风险。

## 反模式

### FAIL: 只看 `exported=true`

```bash
rg 'exported="true"' work/decoded/AndroidManifest.xml
```

直接报告所有 exported 组件会制造噪声。

### PASS: 组件入口到代码闭环

```bash
rg -n 'ExportedActivity|onNewIntent|getIntent|getData|getStringExtra' work/jadx/sources/com/target
```

确认外部可达、攻击者可控输入和敏感 sink 后再定性。
