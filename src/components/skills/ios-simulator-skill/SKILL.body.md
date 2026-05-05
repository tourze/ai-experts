## 代码模式

### 环境与设备

```bash
node scripts/sim_health_check.mjs
node scripts/sim_list.mjs --json
node scripts/simulator_selector.mjs --list --json
node scripts/simctl_create.mjs --list-devices --json
node scripts/simctl_create.mjs --list-runtimes --json
```

### 启动 App 与交互

```bash
node scripts/app_launcher.mjs --launch com.example.app
node scripts/screen_mapper.mjs --hints
node scripts/navigator.mjs --find-text "Login" --tap
node scripts/keyboard.mjs --type "user@example.com"
node scripts/gesture.mjs --scroll down --scroll-amount 3
```

### 调试与构建

```bash
node scripts/app_state_capture.mjs --app-bundle-id com.example.app --size half
node scripts/log_monitor.mjs --app com.example.app --duration 30s --json
node scripts/build_and_test.mjs --project MyApp.xcodeproj --test
node scripts/build_and_test.mjs --list-xcresults --json
```

### 设备状态与权限

```bash
node scripts/status_bar.mjs --preset testing
node scripts/privacy_manager.mjs --grant camera --bundle-id com.example.app
node scripts/push_notification.mjs --bundle-id com.example.app --title "Hello" --body "World"
node scripts/simctl_boot.mjs --name "iPhone 17 Pro" --wait-ready
node scripts/simctl_shutdown.mjs --all
```
