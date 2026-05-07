## 代码模式

### 1. macOS 权限预检查

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

### 2. 截图主入口

使用 `procedure screenshot-take-screenshot`，按目标选择参数：

- 临时截图：`--mode temp`
- 指定路径：`--path output/screen.png`
- 指定区域：`--region 100,200,800,600`
- 指定应用：`--app "Codex"`
- 列出应用窗口：`--list-windows --app "Codex"`
- 指定窗口：`--window-id 12345`
- 活动窗口：`--active-window`

### 3. Windows Node 脚本

使用 `procedure screenshot-take-screenshot-windows`，按目标选择参数：`--mode temp`、`--path "C:\Temp\screen.png"` 或 `--region 100,200,800,600`。
