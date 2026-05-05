## 代码模式

### 查看与搜索

```bash
memo notes
memo notes --folder "Work"
memo notes --search "退款"
memo notes --view 3
```

### 新增、编辑与移动

```bash
memo notes --folder "Work" --add
memo notes --folder "Work" --edit
memo notes --folder "Work" --delete
memo notes --move
```

### 文件夹与导出

```bash
memo notes --flist
memo notes --folder "Archive" --remove
memo notes --export
```

## 检查清单

- 先确认 `memo` 已安装：`memo --help`、`memo notes --help`。
- 操作前确认目标文件夹名称；交互命令默认会弹选择器。
- 如果用户要批量自动化，先验证是否允许交互式操作。
- 导出前提醒用户：导出目标默认在桌面。
- 交叉引用：需要任务提醒时用 `apple-reminders`，不要把 Notes 当待办系统。

## 反模式

### FAIL: 假设 CLI 参数

```bash
memo notes --add "周会纪要"  # 假设的语法
# Error: unknown option
# 实际：--add 只是开关，标题/内容走交互输入
```

### PASS: 先看 --help

```bash
memo notes --help
memo notes --folder "Work" --add  # 触发交互式新建
```

### FAIL: Linux/CI 直接跑

```bash
# CI 上：
memo notes --search "deploy"
# command not found / AppleScript 失败
```

### PASS: 平台前置检查

```bash
[[ "$OSTYPE" == "darwin"* ]] || { echo "memo 仅 macOS"; exit 1; }
memo --help &>/dev/null || { echo "请安装 memo"; exit 1; }
```

### FAIL: 不确认文件夹删除

```bash
memo notes --delete  # 默认目录可能是个人 "Notes" → 误删
```

### PASS: 显式 --folder

```bash
memo notes --folder "Work" --delete
# 范围明确，删除前确认 ID
```
