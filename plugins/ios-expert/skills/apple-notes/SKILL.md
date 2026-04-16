---
name: apple-notes
description: 当用户需要查看、搜索、编辑或导出 Apple Notes 备忘录时使用。
---

# Apple Notes CLI

## 适用场景

- 用户要在 macOS 里查看、搜索、编辑或导出 Apple Notes。
- 用户需要在终端中快速浏览某个文件夹下的备忘录。
- 用户希望把 Notes 内容导出为 HTML / Markdown。

## 核心约束

- 仅支持 macOS，并且第一次使用通常需要授权 Notes 自动化权限。
- 入口命令是 `memo notes`；新增、编辑、删除这类操作依赖交互式选择。
- `--add` / `--edit` / `--delete` 这类操作通常要配合 `--folder` 使用。
- 含图片或附件的笔记不适合直接编辑；导出时要预期格式差异。

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

- 假设 `memo notes --add "标题"` 这种快捷标题参数一定存在。
- 在 Linux / CI 环境中直接尝试运行 `memo`。
- 把带附件的笔记当成纯文本笔记编辑。
- 不确认文件夹就执行删除或移动。
