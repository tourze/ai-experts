---
name: android-emulator-skill
description: 当用户要启动、操作或管理 Android 模拟器、自动化构建部署、查看模拟器日志或做 UI 导航时使用。
---

# Android 模拟器自动化

通过无障碍数据驱动的语义化导航和结构化输出，完成 Android 应用的构建、测试和自动化操作。

## 快速开始

```bash
# 1. 检查环境
node scripts/emu_health_check.mjs

# 2. 启动应用
python scripts/app_launcher.py --launch com.example.app

# 3. 分析当前屏幕元素
python scripts/screen_mapper.py

# 4. 点击按钮
python scripts/navigator.py --find-text "登录" --tap

# 5. 输入文本
python scripts/navigator.py --find-class EditText --enter-text "user@example.com"
```

所有脚本支持 `--help` 查看详细选项。`scripts/screen_mapper.py` 支持 `--json` 输出机器可读格式。

## 脚本清单

### 构建与开发

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/build_and_test.py` | Gradle 构建、安装、测试 | `--task`, `--clean`, `--json` |
| `scripts/log_monitor.mjs` | 实时日志监控与过滤 | `--package`, `--tag`, `--priority`, `--grep` |

### 导航与交互

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/screen_mapper.py` | 分析当前屏幕 UI 层级 | `--verbose`, `--json` |
| `scripts/navigator.py` | 语义化查找并操作元素 | `--find-text`, `--find-id`, `--tap`, `--enter-text`, `--json` |
| `scripts/gesture.mjs` | 滑动、滚动等手势操作 | `--swipe`, `--scroll`, `--duration` |
| `scripts/keyboard.mjs` | 按键事件与硬件按钮 | `--key`, `--text` |
| `scripts/app_launcher.py` | 应用启动/停止/安装/卸载 | `--launch`, `--terminate`, `--install`, `--uninstall`, `--list`, `--json` |

### 模拟器管理

| 脚本 | 用途 | 关键选项 |
|------|------|----------|
| `scripts/emulator_manage.py` | AVD 列表/启动/关闭 | `--list`, `--boot`, `--shutdown`, `--json` |
| `scripts/emu_health_check.mjs` | 环境检查（ADB/Java/SDK） | `--help` |

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

## 反模式

### FAIL: 截图 + 坐标

```bash
# 截屏后凭眼力 → adb shell input tap 187 642
# DPI / 屏幕尺寸 / 字号变 → 点错
```

### PASS: screen_mapper → navigator

```bash
python scripts/screen_mapper.py
python scripts/navigator.py --find-text "登录" --tap
# 基于语义定位，屏幕变化不影响
```

### FAIL: 多设备不指定 serial

```bash
adb devices  # 2 台设备
python scripts/navigator.py --find-text "登录" --tap
# 命令发到随机一台
```

### PASS: 显式 -s

```bash
adb devices
python scripts/navigator.py -s emulator-5554 --find-text "登录" --tap
```
