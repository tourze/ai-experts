
# Intent 与 Deep Link 滥用

## 适用场景
- exported 组件从外部 Intent、deep link、URI 参数或 extras 接收输入。
- 代码出现 `getParcelableExtra`、nested `Intent`、`startActivity`、`startService`、`sendBroadcast`、`setResult`、`grantUriPermission`。
- 需要验证 custom scheme、App Link、intent:// URL、FileProvider grant、PendingIntent mutable 是否可被利用。
- 作为 [android-manifest-security](../android-manifest-security/SKILL.md) 的组件可达性下钻，或 [android-apk-audit](../../android-apk-audit/SKILL.md) 的 IPC 阶段。

## 核心约束
- 先证明入口外部可达，再证明攻击者控制的数据到达 IPC 或 WebView/file/native sink。
- ADB 很难表达复杂 nested `Intent`；必要时用 helper APK、Frida probe 或 Drozer 验证。
- Android 14+ 限制隐式 Intent，但显式 nested relay、FileProvider grant 和 PendingIntent 仍可能可利用。
- Deep link 风险要同时看 Manifest 过滤器、URI 解析代码、参数校验和后续跳转。
- 不把“可打开 deep link”本身报告为漏洞；必须有越权、泄露、注入、重定向或 confused deputy 影响。

## 攻击链模型

```
外部入口 (exported component / BROWSABLE deep link)
   └─ source: Intent data / extras / nested Intent / ClipData / PendingIntent
        ↓ (攻击者控制对象跨入应用信任边界)
应用转发层 (proxy activity / router / dispatcher)
   ├─ startActivity()
   ├─ startService()
   ├─ sendBroadcast()
   ├─ setResult()
   └─ grantUriPermission()
        ↓ (应用身份放大攻击者输入)
内部目标 / 资源
   ├─ non-exported component
   ├─ FileProvider content URI
   ├─ WebView loadUrl/evaluateJavascript
   └─ privileged workflow
```

## 静态分析

### 1. 找入口

```bash
rg -n 'BROWSABLE|VIEW|android:scheme|android:host|android:path|android:autoVerify|android:exported="true"' work/decoded/AndroidManifest.xml
rg -n 'FileProvider|grantUriPermissions|readPermission|writePermission' work/decoded/AndroidManifest.xml work/decoded/res/xml
```

### 2. 找 relay primitive

```bash
rg -n 'getIntent\(|getData\(|getStringExtra|getParcelableExtra|getSerializableExtra|getBundleExtra|getClipData' work/jadx/sources/com/target
rg -n 'startActivity\(|startService\(|startForegroundService\(|bindService\(|sendBroadcast\(|setResult\(|grantUriPermission' work/jadx/sources/com/target
rg -n 'FLAG_GRANT_(READ|WRITE)_URI_PERMISSION|setClipData|setDataAndType|PendingIntent\.FLAG_MUTABLE|PendingIntent\.get' work/jadx/sources/com/target
```

### 3. 判断置信度

| 问题 | 继续条件 |
| --- | --- |
| 入口是否 exported、BROWSABLE 或 App Link 可达 | 是才进入漏洞判断 |
| 攻击者是否控制 nested Intent、URI、ClipData、flags 或 PendingIntent | 是才看 sink |
| 应用是否直接转发对象 | 直接转发比重建安全 Intent 风险高 |
| 是否限制 package/class/action/scheme/host/path/flags | 没有限制时才高置信报告 |
| 是否触达内部组件、文件、账号状态或 WebView | 影响决定严重性 |

## Deep Link 测试

```bash
adb shell am start -a android.intent.action.VIEW -d 'myapp://open?user_id=1'
adb shell am start -a android.intent.action.VIEW -d 'myapp://open?url=file:///data/data/com.target/'
adb shell am start -a android.intent.action.VIEW -d 'https://example.com/path?redirect=https://evil.example'
adb shell dumpsys package com.target | rg -i 'domain|verify|app.link|scheme|host'
```

测试维度：
- custom scheme 是否可被其他 app 抢占；
- `https` App Link 是否 `autoVerify=true` 且 assetlinks 与签名匹配；
- 参数是否进入 WebView、文件路径、SQL、内部路由或账号动作；
- `onCreate` 与 `onNewIntent` 校验是否一致。

## Nested Intent 与 FileProvider 验证

ADB 对 nested Parcelable 不友好；有以下任一证据才报告高置信：
- helper APK 构造 nested `Intent` 成功触达内部组件；
- Frida 记录到 `getParcelableExtra` 后对象进入 `startActivity`/`setResult`；
- Drozer 或 instrumentation 能复现转发；
- FileProvider URI grant 能被攻击者读取或写入。

最小 helper 模式：

```java
Intent nested = new Intent();
nested.setClassName("com.victim", "com.victim.InternalActivity");

Intent wrapper = new Intent();
wrapper.setClassName("com.victim", "com.victim.ProxyActivity");
wrapper.putExtra("target_intent", nested);
startActivity(wrapper);
```

## 修复模式
- 不直接转发外部 nested `Intent`；重建新的 explicit safe intent，只复制已校验的业务字段。
- allowlist package、class、action、scheme、host、path，拒绝未知 extras。
- 清理 `FLAG_GRANT_READ_URI_PERMISSION`、`FLAG_GRANT_WRITE_URI_PERMISSION` 与 `ClipData`。
- `PendingIntent` 默认使用 `FLAG_IMMUTABLE`；必须 mutable 时限制显式 component 和输入字段。
- deep link 的鉴权、对象归属和参数校验放在路由落地前，而不是目标页里补救。

## 报告规则
- 写清 exported/deep link 入口、攻击者控制字段、relay sink、内部目标和影响。
- 对 App Link 说明验证状态和设备 API；不要把 custom scheme hijacking 与 verified App Link 混为一谈。
- 对 FileProvider 写出 authority、path XML、grant flag 和实际可读/可写 URI。

## 反模式

### FAIL: 只发一个 deep link 就报告漏洞

```bash
adb shell am start -a android.intent.action.VIEW -d 'myapp://open'
```

可打开不等于可利用。

### PASS: 参数到 sink 闭环

```bash
rg -n 'getQueryParameter|loadUrl|startActivity|setResult|grantUriPermission' work/jadx/sources/com/target
```

证明参数进入敏感 sink，并用 ADB、helper APK 或 Frida 给出可复现路径。
