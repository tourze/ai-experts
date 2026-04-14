# coding-expert

通用编码守卫插件，提供语言无关的代码质量防护、危险命令拦截、会话上下文注入和桌面通知。

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `encoding-guard` | BOM 检测 + 非 UTF-8 字节序列检测 |
| PostToolUse Edit\|Write | `edit-loop-detector` | 无限编辑循环检测 |
| PostToolUse Edit\|Write | `large-edit-chunk-guard` | 过大单次编辑拦截 |
| PostToolUse Edit\|Write | `merge-conflict-guard` | 未解决合并冲突检测 |
| PostToolUse Edit\|Write | `markdown-budget-guard` | Markdown token 预算 |
| PostToolUse Edit\|Write | `syntax-json` | JSON 语法检查 |
| PostToolUse Edit\|Write | `syntax-xml` | XML 语法检查 |
| PostToolUse Edit\|Write | `syntax-perl` | Perl 语法检查 |
| PreToolUse Bash | `dangerous-command-guard` | 高危命令拦截（rm -rf/force push 等） |
| PreToolUse Bash | `error-retry-guard` | 无修复重试循环检测 |
| PreToolUse Bash | `sed-inplace-guard` | sed 原地编辑警告 |
| PreToolUse Bash | `cat-write-guard` | cat > file 写入模式拦截 |
| PreToolUse Edit\|Write | `garbled-text-guard` | 乱码文本检测 |
| Notification | `desktop-notification` | 桌面通知 |
| Stop | `desktop-notification` | 任务完成通知 |
| SessionStart | `context-injector` | 会话上下文注入 |
| UserPromptSubmit | `debug-methodology-primer` | 调试方法论引导 |
| UserPromptSubmit | `comment-discipline-primer` | 注释纪律引导（WHY/WORKAROUND/契约/并发） |
| UserPromptSubmit | `feedback-detector` | 用户反馈检测 |
| UserPromptSubmit | `investigation-primer` | 调查先行引导 |
| UserPromptSubmit | `over-engineering-primer` | 过度工程化检测 |

## 设计原则

本插件只收录**语言无关**的通用守卫。语言/框架特定的检查属于对应的 `*-expert` 插件。
当前插件仅包含 hooks，不包含 `skills/` 或 `agents/` 组件，因此没有 `SKILL.md` 需要重组。

## 安装

```bash
claude --plugin-dir /path/to/plugins/coding-expert
```

建议与语言专用插件配合使用。

## 验证

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```
