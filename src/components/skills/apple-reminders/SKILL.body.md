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
