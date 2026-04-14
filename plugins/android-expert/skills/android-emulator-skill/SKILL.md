---
name: android-emulator-skill
description: Android 模拟器自动化脚本集，提供语义化 UI 导航、构建自动化、日志监控和模拟器生命周期管理，为 AI Agent 优化了精简输出。
---

# Android 模拟器自动化

通过无障碍数据驱动的语义化导航和结构化输出，完成 Android 应用的构建、测试和自动化操作。

## 快速开始

```bash
# 1. 检查环境（macOS/Linux 用 .sh，Windows 用 .ps1）
bash scripts/emu_health_check.sh

# 2. 启动应用
python scripts/app_launcher.py --launch com.example.app

# 3. 分析当前屏幕元素
python scripts/screen_mapper.py

# 4. 点击按钮
python scripts/navigator.py --find-text "登录" --tap

# 5. 输入文本
python scripts/navigator.py --find-class EditText --enter-text "user@example.com"
```

所有脚本支持 `--help` 查看详细选项。`screen_mapper.py` 支持 `--json` 输出机器可读格式。

## 脚本清单

### 构建与开发

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `build_and_test.py` | Gradle 构建、安装、测试 | `--task`, `--clean`, `--json` |
| `log_monitor.py` | 实时日志监控与过滤 | `--package`, `--tag`, `--priority`, `--duration`, `--json` |

### 导航与交互

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `screen_mapper.py` | 分析当前屏幕 UI 层级 | `--verbose`, `--json` |
| `navigator.py` | 语义化查找并操作元素 | `--find-text`, `--find-id`, `--tap`, `--enter-text`, `--json` |
| `gesture.py` | 滑动、滚动等手势操作 | `--swipe`, `--scroll`, `--duration`, `--json` |
| `keyboard.py` | 按键事件与硬件按钮 | `--key`, `--text`, `--json` |
| `app_launcher.py` | 应用启动/停止/安装/卸载 | `--launch`, `--terminate`, `--install`, `--uninstall`, `--list`, `--json` |

### 模拟器管理

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `emulator_manage.py` | AVD 列表/启动/关闭 | `--list`, `--boot`, `--shutdown`, `--json` |
| `emu_health_check` | 环境检查（ADB/Java/SDK） | `.sh`（macOS/Linux）/ `.ps1`（Windows） |

## 设计原则

* **语义化导航**：通过文本、resource-id、content-description 查找元素，不依赖像素坐标
* **自动设备选择**：单设备时自动选中，多设备时需 `-s <serial>` 指定
* **精简输出**：默认人类可读精简格式，`--json` 切换为机器可读格式
* **零配置**：只需标准 Android SDK 安装即可使用

## 环境要求

* Android SDK Platform-Tools（adb）
* Android Emulator
* Java / OpenJDK
* Python 3
