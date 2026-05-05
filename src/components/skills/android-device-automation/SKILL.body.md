## 快速开始

```bash
# 1. 检查环境
node scripts/emu_health_check.mjs

# 2. 启动应用
node scripts/app_launcher.mjs --launch com.example.app

# 3. 分析当前屏幕元素
node scripts/screen_mapper.mjs

# 4. 点击按钮
node scripts/navigator.mjs --find-text "登录" --tap

# 5. 输入文本
node scripts/navigator.mjs --find-class EditText --enter-text "user@example.com"

# 6. 启动后收集诊断包
node scripts/diagnose_app.mjs --package com.example.app --force-stop --grep AndroidRuntime
```

所有脚本支持 `--help` 查看详细选项。`scripts/screen_mapper.mjs` 支持 `--json` 输出机器可读格式。

## 脚本清单

### 构建与开发

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/build_and_test.mjs` | Gradle 构建、安装、测试 | `--task`, `--clean`, `--json` |
| `scripts/log_monitor.mjs` | 实时日志监控与过滤 | `--package`, `--tag`, `--priority`, `--grep` |
| `scripts/diagnose_app.mjs` | 启动/操作后收集诊断包 | `--package`, `--activity`, `--force-stop`, `--grep`, `--out` |

### 导航与交互

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/screen_mapper.mjs` | 分析当前屏幕 UI 层级 | `--verbose`, `--json` |
| `scripts/navigator.mjs` | 语义化查找并操作元素 | `--find-text`, `--find-id`, `--tap`, `--enter-text`, `--json` |
| `scripts/gesture.mjs` | 滑动、滚动等手势操作 | `--swipe`, `--scroll`, `--duration` |
| `scripts/keyboard.mjs` | 按键事件与硬件按钮 | `--key`, `--text` |
| `scripts/app_launcher.mjs` | 应用启动/停止/安装/卸载 | `--launch`, `--terminate`, `--install`, `--uninstall`, `--list`, `--json` |

### 模拟器管理

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/emulator_manage.mjs` | AVD 列表/启动/关闭 | `--list`, `--boot`, `--shutdown`, `--json` |
| `scripts/emu_health_check.mjs` | 真机/模拟器环境检查（ADB/Java/SDK） | `--help` |

## 设计原则

* **语义化导航**：通过文本、resource-id、content-description 查找元素，不依赖像素坐标
* **自动设备选择**：单设备时自动选中，多设备时需 `-s <serial>` 指定
* **精简输出**：默认人类可读精简格式，`--json` 切换为机器可读格式
* **零配置**：只需标准 Android SDK 安装即可使用

## ADB 操作 Runbook

历史会话里的高频 ADB 调用主要集中在「启动应用、验证前台、截图/UI dump、按 PID 抓日志」。详细流程见 [references/adb-runbook.md](references/adb-runbook.md)。

```bash
node scripts/emu_health_check.mjs
node scripts/app_launcher.mjs --state com.example.app
node scripts/screen_mapper.mjs --json
node scripts/navigator.mjs --find-text "登录" --tap
node scripts/diagnose_app.mjs --package com.example.app --no-launch --grep ReactNativeJS
```

坐标点击只作为兜底：先用 `screen_mapper` / `navigator` 找语义节点；若必须 `--tap-at x,y`，说明坐标来自 `ui.xml` bounds 还是截图人工判断。关键点击后必须截图或 UI dump 验证。

## 环境要求

* Android SDK Platform-Tools（adb）
* Android 真机或 Android Emulator
* Java / OpenJDK
* Node.js

## 反模式

### FAIL: 截图 + 坐标

```bash
# 截屏后凭眼力 → adb shell input tap 187 642
# DPI / 屏幕尺寸 / 字号变 → 点错
```

### PASS: screen_mapper → navigator

```bash
node scripts/screen_mapper.mjs
node scripts/navigator.mjs --find-text "登录" --tap
# 基于语义定位，屏幕变化不影响
```

### FAIL: 多设备不指定 serial

```bash
adb devices  # 2 台设备
node scripts/navigator.mjs --find-text "登录" --tap
# 命令发到随机一台
```

### PASS: 显式 -s

```bash
adb devices
node scripts/navigator.mjs -s emulator-5554 --find-text "登录" --tap
```
