# ReDex — Android 字节码优化

ReDex 是 Facebook 开源的 Android 字节码优化工具，直接操作 DEX 文件，通常在 ProGuard/R8 之后再额外压缩 5-25%。

## 任务决策树

根据用户意图选择路径：

- **安装 ReDex** → 读 `references/installation.md`，按用户平台给出对应步骤
- **选择/配置 pass** → 读 `references/passes.md`，根据优化目标推荐 pass 组合
- **基本集成** → 使用下方「快速开始」模板
- **排查优化问题** → 读 `references/troubleshooting.md`
- **理解某个 pass 原理** → 读 `references/passes.md` 中对应章节

## 快速开始

```bash
redex.py input.apk -o output.apk \
  -c config.json \
  --android-sdk-path $ANDROID_HOME \
  --sign -s release.keystore -a alias -p password
```

默认配置（适合大多数项目的起点）：

```json
{
  "redex": {
    "passes": [
      "ReBindRefsPass",
      "BridgeSynthInlinePass",
      "FinalInlinePassV2",
      "DelSuperPass",
      "SingleImplPass",
      "MethodInlinePass",
      "StaticReloPassV2",
      "RemoveUnreachablePass",
      "ShortenSrcStringsPass",
      "RegAllocPass"
    ]
  }
}
```

## 关键 CLI 参数

| 参数 | 说明 |
|---|---|
| `-o OUT` | 输出 APK（默认 `redex-out.apk`） |
| `-c CONFIG` | JSON 配置文件 |
| `-P proguard.pro` | ProGuard keep 规则 |
| `-m mapping.txt` | ProGuard mapping |
| `--sign -s/-a/-p` | 签名三件套 |
| `--stop-pass PASS` | 在指定 pass 前停止（排查用） |
| `--output-ir` | 导出中间 DEX |
| `TRACE=1` | 环境变量，启用 pass 统计 |

## Pass 参数格式

在配置 JSON 中以 pass 名为 key 添加参数：

```json
{
  "redex": { "passes": ["StripDebugInfoPass"] },
  "StripDebugInfoPass": {
    "drop_local_variables": true,
    "drop_src_files": true
  }
}
```

`redex-all --reflect-config` 导出所有参数文档。

## Gradle 集成

ReDex 作为后处理步骤接在 `assembleRelease` 之后：

```kotlin
tasks.register<Exec>("redexRelease") {
    dependsOn("assembleRelease")
    commandLine("redex.py",
        layout.buildDirectory.file("outputs/apk/release/app-release.apk")
            .get().asFile.absolutePath,
        "-o", "app-release-redex.apk",
        "-c", "${rootDir}/redex-config.json",
        "--sign", "-s", "${rootDir}/release.keystore",
        "-a", "alias", "-p", "password",
        "--android-sdk-path", android.sdkDirectory.absolutePath)
}
```

CI 流程：`assembleRelease` → `redex.py` → `zipalign` + `apksigner` 验证。

## 反模式

### FAIL: 不验证签名对齐

```bash
redex.py input.apk -o output.apk -c config.json --sign -s release.keystore
# 直接上架 → Google Play 拒收
# 缺 zipalign / apksigner verify 验证
```

### PASS: 完整 CI 链路

```bash
redex.py input.apk -o redex.apk -c config.json \
  --sign -s release.keystore -a alias -p "$KS_PWD" \
  --android-sdk-path "$ANDROID_HOME"
zipalign -c -v -P 16 4 redex.apk
apksigner verify --print-certs redex.apk
# 所有步骤过了才上架
```

### FAIL: 激进 pass 组合

```json
{"passes": ["RenameClassesPassV2", "StripDebugInfoPass",
 "ReflectionAnalysisPass", ...（20+）]}
```
→ 过度优化导致运行时崩溃 / 反射失效

### PASS: 渐进启用

```json
{"passes": ["ReBindRefsPass", "FinalInlinePassV2",
 "RemoveUnreachablePass", "RegAllocPass"]}
# 先从保守集合开始
# 每次加 1-2 个 pass + 跑完整测试套件
# 发现崩才知道哪个 pass 有问题
```
