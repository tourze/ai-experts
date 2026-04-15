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
- macOS 进行窗口或应用截图前，先跑 `ensure_macos_permissions.sh`，统一处理 Screen Recording 权限。
- `--app`、`--window-name`、`--list-windows` 只支持 macOS。
- Windows 走 `take_screenshot.ps1`；Python 版在 Windows 上只负责提示，不直接执行。
- 互斥参数不能混用：`--region` / `--window-id` / `--active-window` / `--app` / `--interactive` 要按脚本约束组合。

## 代码模式

### 1. macOS 权限预检查

```bash
bash scripts/ensure_macos_permissions.sh
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

### 3. Windows PowerShell 脚本

```powershell
powershell -ExecutionPolicy Bypass -File scripts/take_screenshot.ps1 -Mode temp
powershell -ExecutionPolicy Bypass -File scripts/take_screenshot.ps1 -Path "C:\Temp\screen.png"
powershell -ExecutionPolicy Bypass -File scripts/take_screenshot.ps1 -Region 100,200,800,600
```

## 检查清单

- 已明确输出位置：显式路径、系统默认目录，还是临时目录。
- macOS 上已经处理过截图权限。
- 需要窗口 ID 时，先用 `--list-windows` 确认。
- 没有同时传入互斥参数。
- 截图命令跑完后，逐个检查输出路径是否真实生成。

## 反模式

- 在 Linux 上使用 `--app` 或 `--window-name`。
- 没做 macOS 权限预检查就直接抓窗口，结果反复弹权限问题。
- 本来只是代理临时自检，却把截图写进项目目录污染工作区。
- 同时传 `--region` 和 `--window-id` 这类互斥参数。
