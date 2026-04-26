# coding-expert

通用编码守卫插件，提供跨语言可复用的代码质量防护、调试语句检测、统一的文件预算守卫、危险命令拦截、会话上下文注入和桌面通知。

## Skills

| Skill | 用途 |
|-------|------|
| `code-review` | 代码质量、命名、职责边界与错误处理审查 |
| `complexity-reducer` | 降低嵌套、耦合和函数复杂度，含 `complexity_report.mjs` 度量脚本与 Python/Go/TS/Rust 简化指南 |
| `debug-methodology` | 系统化定位 bug 与异常行为 |
| `refactoring-checklist` | 为重构提供增量、安全的检查清单 |
| `spec-driven-delivery` | 5 阶段需求驱动交付（Specify→Plan→Act→Review→Vault），10 分 spec 门禁 + journal + 3 次失败协议 |
| `receiving-code-review` | 当收到代码审查反馈、需要在实施建议之前进行技术评估时使用——特别是反馈不明确或技术上存疑时；要求技术严谨和独立验证，而非表演式同意或盲目实施。 |
| `subagent-driven-development` | 当有实现计划需要在当前会话中执行、且各任务相对独立时使用——通过每个任务派遣独立子代理实现，配合双阶段审查（规格合规 + 代码质量），确保高质量快速迭代。 |
| `verification-before-completion` | 当即将声称工作完成、修复生效或测试通过时使用——要求在做出任何完成声明前先运行验证命令并确认输出；证据先于断言，永远如此。 |

## Agents

| Agent | 用途 |
|-------|------|
| `code-reviewer` | 通用代码质量、命名、错误处理与结构风险的只读评审 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `encoding-guard` | BOM 检测 + 非 UTF-8 字节序列检测 |
| PostToolUse Edit\|Write | `edit-loop-detector` | 无限编辑循环检测 |
| PostToolUse Edit\|Write | `large-edit-chunk-guard` | 过大单次编辑拦截 |
| PostToolUse Edit\|Write | `merge-conflict-guard` | 未解决合并冲突检测 |
| PostToolUse Edit\|Write | `debug-statement-guard` | 跨语言调试断点与调试输出检测 |
| PostToolUse Edit\|Write | `file-budget-guard` | 跨语言代码文件预算与历史超标文件棘轮治理 |
| PostToolUse Edit\|Write | `markdown-budget-guard` | Markdown token 预算 |
| PostToolUse Edit\|Write | `syntax-json` | JSON 语法检查 |
| PostToolUse Edit\|Write | `syntax-xml` | XML 语法检查 |
| PreToolUse Bash | `dangerous-command-guard` | 破坏性文件系统命令拦截（rm -rf 等） |
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

本插件收录**跨语言可复用**的通用方法论 skill 与守卫。语言/框架特定的检查属于对应的 `*-expert` 插件；仓库中的 `encoding-guard`、通用 `debug-statement-guard` 与跨语言 `file-budget-guard` 也只在这里维护。

## 安装

```bash
claude --plugin-dir /path/to/plugins/coding-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install coding-expert@ai-experts
claude plugin install coding-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall coding-expert
claude plugin uninstall coding-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

建议与语言专用插件配合使用；语言插件通过依赖本插件复用通用编码与文件预算守卫。

## 验证

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --check skills/complexity-reducer/scripts/complexity_report.mjs
node --test tests/*.test.mjs
```
