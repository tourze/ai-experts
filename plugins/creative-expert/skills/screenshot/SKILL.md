---
name: screenshot
description: 当用户要截桌面、截窗口、截指定区域或做系统级截图时使用。
---

# 系统截图

## 适用场景

- 用户明确要求截取桌面、应用窗口、活动窗口或像素区域。
- 需要对桌面应用、原生窗口、系统弹窗做截图。
- 需要临时保存到系统默认目录或临时目录，供后续查看。
- 如果浏览器、Figma 或其他专用工具已经能直接截图，优先用专用工具，不要多绕一层系统截图。

## 核心约束

- 保存路径遵循三条规则：用户给路径就存到该路径；用户没给路径则存系统默认截图目录；仅供代理自检时存临时目录。
- macOS 进行窗口或应用截图前，先跑 `scripts/ensure_macos_permissions.mjs`，统一处理 Screen Recording 权限。
- `--app`、`--window-name`、`--list-windows` 只支持 macOS。
- Windows 走 `scripts/take_screenshot_windows.mjs`；Python 版会在 Windows 分支委托给该 Node 入口。
- 互斥参数不能混用：`--region` / `--window-id` / `--active-window` / `--app` / `--interactive` 要按脚本约束组合。

## 代码模式

### 1. macOS 权限预检查

```bash
node scripts/ensure_macos_permissions.mjs
```

### 2. Python 脚本

```bash
python3 scripts/take_screenshot.py --mode temp
python3 scripts/take_screenshot.py --path output/screen.png
python3 scripts/take_screenshot.py --region 100,200,800,600
python3 scripts/take_screenshot.py --app "Codex"
python3 scripts/take_screenshot.py --list-windows --app "Codex"
python3 scripts/take_screenshot.py --window-id 12345
python3 scripts/take_screenshot.py --active-window
```

### 3. Windows Node 脚本

```bash
node scripts/take_screenshot_windows.mjs --mode temp
node scripts/take_screenshot_windows.mjs --path "C:\Temp\screen.png"
node scripts/take_screenshot_windows.mjs --region 100,200,800,600
```

## 检查清单

- 已明确输出位置：显式路径、系统默认目录，还是临时目录。
- macOS 上已经处理过截图权限。
- 需要窗口 ID 时，先用 `--list-windows` 确认。
- 没有同时传入互斥参数。
- 截图命令跑完后，逐个检查输出路径是否真实生成。

## 反模式

### FAIL: 不预检查 macOS 权限

```bash
python3 scripts/take_screenshot.py --app "Codex"
# 弹"未授权 Screen Recording"
# 用户授权 → 重跑 → 仍弹（macOS 缓存问题）
# 反复 5 次
```

### PASS: 先 ensure_permissions

```bash
node scripts/ensure_macos_permissions.mjs
# 一次性处理权限链 → 后续命令稳定
python3 scripts/take_screenshot.py --app "Codex"
```

### FAIL: 临时截图污染项目

```bash
# 代理自检
python3 scripts/take_screenshot.py --path ./debug.png
git status  # ./debug.png 进了暂存区
# 不小心 commit / push
```

### PASS: 临时模式

```bash
python3 scripts/take_screenshot.py --mode temp
# 输出到 /tmp/xxx.png，不污染项目
```
