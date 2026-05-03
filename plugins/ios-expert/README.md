# ios-expert

iOS / Apple 平台专家能力，覆盖 Swift Concurrency、SwiftUI 性能与模式、iOS/macOS HIG、App Store 审核与发布，以及 Apple 工具自动化。

## 目录结构

- `hooks/`：3 个本地 PostToolUse 守卫。
- `skills/`：11 个 iOS / Apple 平台技能与配套参考资料。
- `agents/`：2 个 iOS 运行审计与模拟器冒烟测试代理。
- `tests/`：最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `swift-concurrency-expert` | Swift 6.2+ 并发审查与修复 |
| `swiftui-performance-audit` | SwiftUI 运行时性能审计 |
| `swiftui-ui-patterns` | SwiftUI 视图与组件最佳实践、视图重构与依赖注入 |
| `ios-hig-design` | Apple Human Interface Guidelines（iOS） |
| `ios-simulator-skill` | iOS 模拟器自动化流程 |
| `apple-appstore-reviewer` | App Store 审核规则检查 |
| `liquid-glass-design` | iOS 26 液态玻璃设计系统 |
| `app-store-optimization` | App Store ASO 优化与排名追踪（含更新文案） |
| `macos-design-guidelines` | Apple Human Interface Guidelines（macOS） |
| `apple-notes` | Apple Notes 管理（memo CLI） |
| `apple-reminders` | Apple Reminders 管理（remindctl CLI） |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `lint-swift-concurrency` | Swift Concurrency 并发安全检查 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | 调试语句残留检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## Agents

| Agent | 用途 |
|-------|------|
| `ios-simulator-smoke-tester` | 执行 iOS 模拟器关键流程冒烟测试 |
| `mobile-release-reviewer` | 当 iOS/Android 应用准备提审或发版时使用——检查二进制安全、审核指南合规、ASO 优化和更新文案。只读分析，产出发布就绪报告。 |
| `swiftui-engineer` | SwiftUI 视图 / 导航 / 列表性能 / Swift Concurrency 工程审查与重构建议，含 HIG / Liquid Glass / macOS HIG 合规检查 |

## 验证命令

在当前目录执行：

```bash
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。
