# ios-expert

iOS / Apple 平台专家插件，覆盖 Swift Concurrency、SwiftUI 性能与模式、iOS/macOS HIG、App Store 审核与发布，以及 Apple 工具自动化。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 和 1 个本地 PostToolUse 守卫。
- `skills/`：13 个 iOS / Apple 平台技能与配套参考资料、脚本。
- `agents/`：2 个 iOS 运行审计与模拟器冒烟测试代理。
- `tests/`：manifest 最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `swift-concurrency-expert` | Swift 6.2+ 并发审查与修复 |
| `swiftui-performance-audit` | SwiftUI 运行时性能审计 |
| `swiftui-ui-patterns` | SwiftUI 视图与组件最佳实践 |
| `swiftui-view-refactor` | SwiftUI 视图重构与依赖注入 |
| `ios-hig-design` | Apple Human Interface Guidelines（iOS） |
| `ios-simulator-skill` | iOS 模拟器自动化脚本 |
| `apple-appstore-reviewer` | App Store 审核规则检查 |
| `app-store-changelog` | App Store 发布说明生成 |
| `liquid-glass-design` | iOS 26 液态玻璃设计系统 |
| `app-store-optimization` | App Store ASO 优化与排名追踪 |
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
| `ios-release-auditor` | 只读审计 Info.plist、entitlements、能力开关与 App Review 风险 |
| `ios-simulator-smoke-tester` | 使用本插件模拟器脚本执行关键流程冒烟测试 |

## 验证命令

在插件目录执行：

```bash
claude plugin validate .
jq empty hooks/hooks.json
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
find skills -path '*/scripts/*.mjs' -print0 | xargs -0 -n1 node --check
find skills -path '*/scripts/*.py' -print0 | xargs -0 python3 -m py_compile
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

