## 代码模式

### 查看提醒

```bash
remindctl
remindctl today
remindctl show overdue
remindctl show 2026-01-04
remindctl show --list Work --json
```

### 管理列表

```bash
remindctl list
remindctl list Work
remindctl list Projects --create
remindctl list Work --rename Office
remindctl list Work --delete
```

### 新增、完成与删除

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl complete 1 2 3
remindctl delete 4A83 --force
```

## 检查清单

- 先跑 `remindctl status`，未授权时执行 `remindctl authorize`。
- 查看类需求优先用 `show` 过滤器：`today` / `tomorrow` / `week` / `overdue` / `all` / 指定日期。
- 需要脚本化输出时使用 `--json` 或 `--plain`。
- 删除和列表变更属于破坏性动作，执行前要确认目标 ID 或列表名。
- 交叉引用：更适合做长期记录的内容改用 `apple-notes`。

## 反模式

### FAIL: 误把过滤器当子命令

```md
## 子命令
- `remindctl today` 显示今日任务
- `remindctl week` 显示本周任务
- `remindctl overdue` 显示逾期
→ 文档遗漏了真正的入口 `show`
→ `remindctl tomorrow` / `remindctl 2026-04-20` 用户不知道存在
```

### PASS: show 是入口

```md
## 入口
remindctl show [filter]
filter ∈ today | tomorrow | week | overdue | all | YYYY-MM-DD

`remindctl today` 是 `show today` 的快捷别名
```

### FAIL: 跳过权限检查

```bash
remindctl add "买牛奶"
# Error: not authorized to access reminders
# 用户首次运行被拦
```

### PASS: 自动 status + authorize

```bash
status=$(remindctl status)
[[ "$status" != *"granted"* ]] && remindctl authorize
remindctl add "买牛奶" --due tomorrow
```

### FAIL: 不校验 ID 批量删

```bash
remindctl delete 1 2 3 4 5  # ID 取自上次会话
# 列表已变化 → 删错任务
```

### PASS: 先 show 再删

```bash
remindctl show today --json | jq '.[].id'  # 拿当前 ID
# 用户确认 → 再 delete
```
