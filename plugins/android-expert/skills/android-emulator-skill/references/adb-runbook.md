# ADB 操作 Runbook

本 runbook 来自历史会话里的高频 ADB 使用模式：启动应用、验证前台、截图/UI dump、按 PID 抓日志。

## 设备与目标确认

```bash
node scripts/emu_health_check.mjs
adb devices -l
node scripts/app_launcher.mjs --state com.example.app
```

- 单设备可自动选择；多设备必须传 `-s <serial>`。
- 先确认包名和启动状态，再安装、清数据或重启，避免把失败归因到错误设备。

## 启动后诊断包

```bash
node scripts/diagnose_app.mjs \
  --package com.example.app \
  --activity .MainActivity \
  --force-stop \
  --grep AndroidRuntime \
  --out /tmp/android-diagnose-example
```

诊断包会收集：

- `summary.json`：设备、PID、执行过的 ADB 命令和文件索引
- `screen.png`：当前屏幕截图
- `ui.xml`：`uiautomator dump` 结果
- `logcat.txt` / `logcat-filtered.txt`：启动后日志窗口
- `dumpsys-window.txt` / `dumpsys-activity-top.txt`：前台窗口和 Activity 状态

## UI 导航闭环

```bash
node scripts/screen_mapper.mjs --json
node scripts/navigator.mjs --find-text "登录" --tap
node scripts/diagnose_app.mjs --package com.example.app --no-launch --grep ReactNativeJS
```

- 先用 `screen_mapper` 找文本、`resource-id` 或 `content-desc`。
- 找不到语义节点时，才用 `navigator --tap-at x,y` 兜底，并在说明里记录坐标来源。
- 每次关键点击后都做截图或 UI dump 验证，不把 `adb shell input tap` 的退出码当成成功。

## 日志与性能下钻

```bash
node scripts/log_monitor.mjs --package com.example.app --clear --priority E
adb shell dumpsys gfxinfo com.example.app
adb shell dumpsys meminfo com.example.app
```

- 崩溃、闪退、启动失败：先清日志，再启动，再按 PID 抓 `logcat`。
- 卡顿、白屏、内存异常：补 `dumpsys gfxinfo`、`dumpsys meminfo`、`dumpsys activity top`。
- 网络问题：在设备内跑 `curl`/`ping`/`ip addr`，不要只看宿主机网络。
