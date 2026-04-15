---
name: apple-reminders
description: 当用户要查看、创建、完成、删除或管理 Apple Reminders 提醒事项时使用。
homepage: https://github.com/steipete/remindctl
metadata:
  openclaw:
    emoji: "⏰"
    os:
      - "darwin"
    requires:
      bins:
        - "remindctl"
    install:
      - id: "brew"
        kind: "brew"
        formula: "steipete/tap/remindctl"
        bins:
          - "remindctl"
        label: "Install remindctl via Homebrew"
---

# Apple Reminders CLI

## 适用场景

- 用户要把待办写入 Apple Reminders，并同步到 iPhone / iPad / Mac。
- 用户要查看今天、逾期、本周或指定日期的提醒事项。
- 用户要管理提醒列表、完成任务或删除任务。

## 核心约束

- 仅支持 macOS；首次使用要授权 Reminders 访问权限。
- 查看命令的核心入口是 `remindctl show [filter]`，默认直接执行 `remindctl` 也会走查看逻辑。
- 创建、完成、删除命令都有独立子命令：`add` / `complete` / `delete`。
- 如果用户说“提醒我”，先确认他要的是 Apple Reminders 里的系统提醒，而不是对话内定时提醒。

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

- 把 `today`、`week` 当成独立子命令文档化，而忽略它们本质上是 `show` 的过滤器。
- 没确认用户是否真的要写入 Reminders，就直接创建系统待办。
- 省略权限检查，导致命令在首次运行时失败。
- 不校验提醒 ID 就执行批量完成或删除。
