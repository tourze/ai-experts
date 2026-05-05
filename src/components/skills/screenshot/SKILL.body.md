## 核心约束

- 保存路径遵循三条规则：用户给路径就存到该路径；用户没给路径则存系统默认截图目录；仅供代理自检时存临时目录。
- macOS 进行窗口或应用截图前，先跑 `scripts/ensure_macos_permissions.mjs`，统一处理 Screen Recording 权限。
- `--app`、`--window-name`、`--list-windows` 只支持 macOS。
- Windows 走 `scripts/take_screenshot_windows.mjs`；主入口会在 Windows 分支委托给该 Node helper。
- 互斥参数不能混用：`--region` / `--window-id` / `--active-window` / `--app` / `--interactive` 要按脚本约束组合。

## 代码模式

### 1. macOS 权限预检查

```bash
node scripts/ensure_macos_permissions.mjs
```

### 2. 截图主入口

```bash
node scripts/take_screenshot.mjs --mode temp
node scripts/take_screenshot.mjs --path output/screen.png
node scripts/take_screenshot.mjs --region 100,200,800,600
node scripts/take_screenshot.mjs --app "Codex"
node scripts/take_screenshot.mjs --list-windows --app "Codex"
node scripts/take_screenshot.mjs --window-id 12345
node scripts/take_screenshot.mjs --active-window
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
node scripts/take_screenshot.mjs --app "Codex"
# 弹"未授权 Screen Recording"
# 用户授权 → 重跑 → 仍弹（macOS 缓存问题）
# 反复 5 次
```

### PASS: 先 ensure_permissions

```bash
node scripts/ensure_macos_permissions.mjs
# 一次性处理权限链 → 后续命令稳定
node scripts/take_screenshot.mjs --app "Codex"
```

### FAIL: 临时截图污染项目

```bash
# 代理自检
node scripts/take_screenshot.mjs --path ./debug.png
git status  # ./debug.png 进了暂存区
# 不小心 commit / push
```

### PASS: 临时模式

```bash
node scripts/take_screenshot.mjs --mode temp
# 输出到 /tmp/xxx.png，不污染项目
```
