# swift-expert

Swift/Apple 平台专家插件，覆盖 Swift Concurrency、SwiftUI 性能与模式、HIG 设计规范、App Store 审核与发布。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 和 4 个 PostToolUse 守卫。
- `skills/`：13 个 Swift / Apple 平台技能与配套参考资料、脚本。

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
| PostToolUse Edit\|Write | `debug-statement-guard` | 调试语句残留检测 |
| PostToolUse Edit\|Write | `encoding-guard` | 文件编码检查 |
| PostToolUse Edit\|Write | `file-budget-guard` | Swift 文件行数预算（500 行） |

## 验证命令

在插件目录执行：

```bash
claude plugin validate .
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
find skills -path '*/scripts/*.py' -print0 | xargs -0 python3 -m py_compile
find skills -path '*/scripts/*.sh' -print0 | xargs -0 -n1 bash -n
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/swift-expert
```
