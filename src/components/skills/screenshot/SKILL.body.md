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
