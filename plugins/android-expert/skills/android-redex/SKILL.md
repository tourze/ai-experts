---
name: android-redex
description: 当用户要用 ReDex 优化 Android APK 体积或性能、配置 ReDex pass、集成 ReDex 到构建流程、排查 ReDex 优化问题时使用。英文触发词包括 ReDex、redex.py、dex optimization、APK size reduction、bytecode optimization。
---

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
