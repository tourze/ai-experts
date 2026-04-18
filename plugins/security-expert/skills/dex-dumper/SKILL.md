---
name: dex-dumper
description: "当需要从运行中的 Android 应用内存中 dump DEX 文件以绕过加壳保护时使用。"
---

# DEX 内存 Dump

## 适用场景
- APK 使用了加固/加壳（360、梆梆、爱加密等），jadx 反编译后只看到壳代码。
- 需要在运行时等壳解密后从内存中提取真实 DEX。
- 需要与 [jadx](../jadx/SKILL.md) 配合：dump 出的 DEX 用 jadx 反编译得到真实业务代码。
- 需要与 [apktool](../apktool/SKILL.md) 区分：apktool 是静态解包，本 skill 是动态脱壳。

## 核心约束
- 必须在 root 设备或模拟器上执行（需要 ptrace 权限）。
- 等应用完全加载（过启动页）再 dump，否则壳还没解密。
- dump 出的 DEX 可能有多个，全部拉取。
- dump 完成后清理设备上的文件和工具。

## 实施步骤

### 步骤 1：确认 ADB 连接

```bash
adb devices  # 确认设备在线
adb root     # 获取 root 权限（模拟器通常默认 root）
```

### 步骤 2：获取目标包名

```bash
# 获取前台应用包名
adb shell dumpsys activity top | grep 'ACTIVITY' | tail -1 | awk '{print $2}' | cut -d/ -f1
```

### 步骤 3：推送 dump 工具并执行

```bash
adb push panda-dex-dumper /data/local/tmp/
adb shell chmod +x /data/local/tmp/panda-dex-dumper
adb shell "cd /data/local/tmp && ./panda-dex-dumper -p $(pidof <package_name>)"
```

### 步骤 4：拉取 DEX 文件

```bash
adb pull /data/local/tmp/panda/ ./dumped-dex/
```

### 步骤 5：清理设备

```bash
adb shell rm -rf /data/local/tmp/panda/ /data/local/tmp/panda-dex-dumper
```

### 步骤 6：反编译 dump 出的 DEX

```bash
jadx -d dumped-code dumped-dex/*.dex
```

## 检查清单
- `pidof` 返回空时先启动应用：`adb shell monkey -p <pkg> -c android.intent.category.LAUNCHER 1`。
- 多个 DEX 文件是正常的，加固应用通常分多个。
- dump 失败通常是权限不足：确认已 `adb root` 或通过 `su` 执行。
- 对比 dump 出的 DEX 与原始 APK 中的 DEX：如果相同，说明没有加壳。

## 反模式

### FAIL: 启动后立即 dump

```bash
adb shell am start -n com.app/.MainActivity
adb shell ./panda-dex-dumper -p $(pidof com.app)  # 立即执行
# → dump 到的还是壳的 DEX，真实代码还没解密加载
```

### PASS: 等待完全加载后 dump

```bash
adb shell am start -n com.app/.MainActivity
sleep 10  # 等应用完全启动，过完启动页
adb shell ./panda-dex-dumper -p $(pidof com.app)
# → dump 到解密后的真实 DEX
```
