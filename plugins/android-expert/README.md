# android-expert

Android 开发专家能力，覆盖架构模式、Kotlin Coroutines、无障碍访问、Material Design 3、真机/模拟器自动化和测试策略。

## 结构

- `hooks/`：1 个 PostToolUse Edit\|Write 守卫。
- `skills/`：Android 主题技能文档。
- `tests/`：最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `android-accessibility` | 无障碍审计与修复（TalkBack/语义化） |
| `android-architecture` | 现代 Android 架构（MVVM/MVI/Clean Architecture） |
| `android-coroutines` | Kotlin Coroutines 生产级模式 |
| `android-design-guidelines` | Material Design 3 与平台设计规范 |
| `android-emulator-skill` | 真机/模拟器自动化流程（构建/测试/截图） |
| `android-redex` | ReDex APK 体积/性能优化与构建流程集成 |
| `android-testing` | Unit/Integration/Hilt/Screenshot 全链路测试 |

## Agents

| Agent | 用途 |
|-------|------|
| `android-reviewer` | review Android application code for architecture patterns, lifecycle management, Jetpack Compose best practices, accessibility compliance, and performance issues |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/android-expert/tests/*.test.mjs
```
