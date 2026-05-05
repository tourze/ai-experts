## 代码模式

### 启动方式

```bash
frida -U -f com.example.app -l hook.js    # spawn 模式
frida -U com.example.app -l hook.js       # attach 已运行进程
frida -U -p 1234 -l hook.js              # 按 PID attach
```

### Native hook

```javascript
var mod = Process.getModuleByName("libssl.so");
Interceptor.attach(mod.getExportByName("SSL_read"), {
    onEnter(args) {
        console.log("fd:", args[0].toInt32());
    },
    onLeave(retval) {
        console.log("read:", retval.toInt32(), "bytes");
    }
});
```

### Java hook (Android)

```javascript
Java.perform(function () {
    var Activity = Java.use("android.app.Activity");
    Activity.onCreate.implementation = function (bundle) {
        console.log("onCreate:", this.getClass().getName());
        this.onCreate(bundle);
    };
});
```

### ObjC hook (iOS)

```javascript
var hook = ObjC.classes.NSURLSession["- dataTaskWithRequest:completionHandler:"];
Interceptor.attach(hook.implementation, {
    onEnter(args) {
        var req = new ObjC.Object(args[2]);
        console.log("URL:", req.URL().absoluteString().toString());
    }
});
```

## 自适应 bypass 流程

1. **静态阶段**：用 jadx/class-dump 定位保护类和检测方法。
2. **首次 hook**：针对定位到的具体类写 bypass 脚本。
3. **运行 → 崩溃 → 诊断**：读 crash log，定位崩溃原因。
4. **迭代修复**：根据 crash 模式调整 hook，直到通过。

| Crash 信号 | 可能原因 | 排查方向 |
|-----------|---------|---------|
| SIGABRT | 原生反篡改 | 搜索 `abort()` 调用链 |
| SecurityException | 签名校验 | hook `PackageManager.getPackageInfo` |
| `System.exit` 在栈中 | RASP 框架 | hook `System.exit` 并打印调用栈 |

## 反模式

### FAIL: 通用脚本盲跑

```javascript
// 从网上复制的 "universal SSL pinning bypass"
// → 对 OkHttp 4.x 的 CertificatePinner 无效
// → 对自定义 TrustManager 无效
```

### PASS: 针对目标定制

```javascript
// 1. jadx 中搜索 CertificatePinner / X509TrustManager
// 2. 确认具体类名和方法签名
// 3. 针对该类写 hook
var Pinner = Java.use("okhttp3.CertificatePinner");
Pinner.check.overload("java.lang.String", "java.util.List")
    .implementation = function (host, certs) {
        console.log("Bypassed pinning for:", host);
    };
```
