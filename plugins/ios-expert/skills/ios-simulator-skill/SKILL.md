---
name: ios-simulator-skill
description: 当用户需要用 Simulator、xcrun simctl、设备启动、截图、安装包、日志采集或提审前自动化回归时使用。
---

# iOS 模拟器自动化

## 适用场景

- 需要在模拟器里构建、运行、排查 iOS 应用问题。
- 需要通过无障碍树导航界面，而不是靠像素坐标硬点。
- 需要抓日志、截图、UI 树、权限状态、状态栏和推送来复现问题。
- 需要批量启动、关闭、擦除、创建或选择模拟器。

## 核心约束

- 仅把 `scripts/` 目录下的可执行 Node / Python / Shell 脚本当作入口；`scripts/common/` 与 `scripts/xcode/` 是内部模块，不直接执行。
- 优先走无障碍树：先 `scripts/screen_mapper.mjs` / `scripts/navigator.mjs`，最后才用坐标。
- 大多数脚本在未传 `--udid` 时会自动选择 booted simulator；`scripts/log_monitor.mjs` 例外，参数名是 `--device-udid`。
- `scripts/visual_diff.py` 与截图缩放能力依赖 `Pillow`；若缺失，需要先安装对应 Python 包。

## 代码模式

### 环境与设备

```bash
node scripts/sim_health_check.mjs
python3 scripts/sim_list.py --json
python3 scripts/simulator_selector.py --list --json
node scripts/simctl_create.mjs --list-devices --json
node scripts/simctl_create.mjs --list-runtimes --json
```

### 启动 App 与交互

```bash
node scripts/app_launcher.mjs --launch com.example.app
node scripts/screen_mapper.mjs --hints
node scripts/navigator.mjs --find-text "Login" --tap
node scripts/keyboard.mjs --type "user@example.com"
node scripts/gesture.mjs --scroll down --scroll-amount 3
```

### 调试与构建

```bash
python3 scripts/app_state_capture.py --app-bundle-id com.example.app --size half
node scripts/log_monitor.mjs --app com.example.app --duration 30s --json
python3 scripts/build_and_test.py --project MyApp.xcodeproj --test
python3 scripts/build_and_test.py --list-xcresults --json
```

### 设备状态与权限

```bash
node scripts/status_bar.mjs --preset testing
node scripts/privacy_manager.mjs --grant camera --bundle-id com.example.app
node scripts/push_notification.mjs --bundle-id com.example.app --title "Hello" --body "World"
node scripts/simctl_boot.mjs --name "iPhone 17 Pro" --wait-ready
node scripts/simctl_shutdown.mjs --all
```

## 检查清单

- 先跑 `node scripts/sim_health_check.mjs`，确认 `xcrun`、`simctl`、Python 环境可用。
- 每次交互前先看 `scripts/screen_mapper.mjs` 或 `scripts/navigator.mjs --list`，不要盲点。
- 需要日志时确认参数名：`scripts/log_monitor.mjs` 用 `--device-udid`，不是 `--udid`。
- 需要脚本化输出时统一使用 `--json`；需要完整参数时直接跑对应脚本的 `--help`。
- 交叉引用：性能瓶颈排查看 `swiftui-performance-audit`；审核流程复现看 `apple-appstore-reviewer`。

## 反模式

### FAIL: 用截图坐标导航

```python
# 截图后凭眼力定位"登录"按钮
device.tap(187, 642)  # 写死坐标
# iPhone 14 → iPhone 15 屏幕变 → 坐标偏移 → 点到别处
# Dynamic Type 大字号 → 按钮位置变 → 失败
```

### PASS: 无障碍树语义查找

```bash
# 先看屏幕结构
node scripts/screen_mapper.mjs --hints
# 按文本/role 定位
node scripts/navigator.mjs --find-text "登录" --tap
# 任何屏幕尺寸/字号都稳定
```

### FAIL: 没 booted simulator 直接跑

```bash
node scripts/log_monitor.mjs --app com.example.app
# Error: no booted device
# 用户："我以为脚本会自动启动"
```

### PASS: 先 boot

```bash
node scripts/simctl_boot.mjs --name "iPhone 17 Pro" --wait-ready
node scripts/log_monitor.mjs --device-udid <udid> --app com.example.app
# 注意：log_monitor 用 --device-udid，其他用 --udid
```

### FAIL: 文档穷举参数

```md
## screen_mapper 完整参数
--verbose / --hints / --json / --filter / --max-depth ...
（30 个参数）
→ 1 个月后参数变化，文档过时仍有人复制
```

### PASS: --help 是真值

```md
## screen_mapper
常用：node scripts/screen_mapper.mjs --hints --json
完整参数：node scripts/screen_mapper.mjs --help
（脚本变更时帮助文本自动同步）
```
