## 快速开始

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

所有脚本支持 `--help` 查看详细选项。`procedure android-device-automation-screen-mapper` 支持 `--json` 输出机器可读格式。

## 脚本清单

### 构建与开发

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `procedure android-device-automation-build-and-test` | Gradle 构建、安装、测试 | `--task`, `--clean`, `--json` |
| `procedure android-device-automation-log-monitor` | 实时日志监控与过滤 | `--package`, `--tag`, `--priority`, `--grep` |
| `procedure android-device-automation-diagnose-app` | 启动/操作后收集诊断包 | `--package`, `--activity`, `--force-stop`, `--grep`, `--out` |

### 导航与交互

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `procedure android-device-automation-screen-mapper` | 分析当前屏幕 UI 层级 | `--verbose`, `--json` |
| `procedure android-device-automation-navigator` | 语义化查找并操作元素 | `--find-text`, `--find-id`, `--tap`, `--enter-text`, `--json` |
| `procedure android-device-automation-gesture` | 滑动、滚动等手势操作 | `--swipe`, `--scroll`, `--duration` |
| `procedure android-device-automation-keyboard` | 按键事件与硬件按钮 | `--key`, `--text` |
| `procedure android-device-automation-app-launcher` | 应用启动/停止/安装/卸载 | `--launch`, `--terminate`, `--install`, `--uninstall`, `--list`, `--json` |

### 模拟器管理

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `procedure android-device-automation-emulator-manage` | AVD 列表/启动/关闭 | `--list`, `--boot`, `--shutdown`, `--json` |
| `procedure android-device-automation-emu-health-check` | 真机/模拟器环境检查（ADB/Java/SDK） | `--help` |

## 设计原则

* **语义化导航**：通过文本、resource-id、content-description 查找元素，不依赖像素坐标
* **自动设备选择**：单设备时自动选中，多设备时需 `-s <serial>` 指定
* **精简输出**：默认人类可读精简格式，`--json` 切换为机器可读格式
* **零配置**：只需标准 Android SDK 安装即可使用

## ADB 操作 Runbook

历史会话里的高频 ADB 调用主要集中在「启动应用、验证前台、截图/UI dump、按 PID 抓日志」。详细流程见 [references/adb-runbook.md](references/adb-runbook.md)。

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

坐标点击只作为兜底：先用 `screen_mapper` / `navigator` 找语义节点；若必须 `--tap-at x,y`，说明坐标来自 `ui.xml` bounds 还是截图人工判断。关键点击后必须截图或 UI dump 验证。

## 环境要求

* Android SDK Platform-Tools（adb）
* Android 真机或 Android Emulator
* Java / OpenJDK
* Node.js
