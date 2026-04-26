# android-expert

Android 开发专家插件，覆盖架构模式、Kotlin Coroutines、无障碍访问、Material Design 3、模拟器自动化和测试策略。

## 结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：Android 主题技能文档。
- `tests/`：manifest 最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `android-accessibility` | 无障碍审计与修复（TalkBack/语义化） |
| `android-architecture` | 现代 Android 架构（MVVM/MVI/Clean Architecture） |
| `android-coroutines` | Kotlin Coroutines 生产级模式 |
| `android-design-guidelines` | Material Design 3 与平台设计规范 |
| `android-emulator-skill` | 模拟器自动化脚本（构建/测试/截图） |
| `android-redex` | ReDex APK 体积/性能优化与构建流程集成 |
| `android-testing` | Unit/Integration/Hilt/Screenshot 全链路测试 |

## Agents

| Agent | 用途 |
|-------|------|
| `android-reviewer` | review Android application code for architecture patterns, lifecycle management, Jetpack Compose best practices, accessibility compliance, and performance issues |

## 安装

```bash
claude --plugin-dir /path/to/plugins/android-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install android-expert@ai-experts
claude plugin install android-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall android-expert
claude plugin uninstall android-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

建议同时安装 `java-expert` 插件以获得 Java/Kotlin 语法检查。

## 验证

```bash
jq empty plugins/android-expert/hooks/hooks.json
node --check plugins/android-expert/hooks/dispatch.mjs
node --test plugins/android-expert/tests/*.test.mjs
```
