# coding-expert

通用编码守卫能力，提供跨语言可复用的代码质量防护、调试语句检测、统一的文件预算守卫、危险命令拦截、会话上下文注入和桌面通知。

## Skills

| Skill | 用途 |
|-------|------|
| `chrome-devtools` | 用 Chrome DevTools 做页面调试、网络排障、性能分析或 Lighthouse 审计 |
| `code-engineer-agent-framework` | 可写 engineer agent 的共享执行骨架：实现门禁、写入边界、验证闭环与交付报告 |
| `code-review` | 代码质量、命名、职责边界与错误处理审查 |
| `complexity-reducer` | 降低嵌套、耦合和函数复杂度，含复杂度度量、简化指南与完成前验证检查清单 |
| `debug-methodology` | 系统化定位 bug 与异常行为 |
| `refactoring-checklist` | 为重构提供增量、安全的检查清单 |
| `memory-safety-patterns` | C/C++ 资源所有权、智能指针与内存安全模式 |
| `subagent-driven-development` | 当有实现计划需要在当前会话中执行、且各任务相对独立时使用——通过每个任务派遣独立子代理实现，配合双阶段审查（规格合规 + 代码质量），确保高质量快速迭代。 |

## Agents

| Agent | 用途 |
|-------|------|
| `bug-investigator` | 只读追踪 bug 执行路径、提出可证伪假设并定位根因 |
| `code-reviewer` | 通用代码质量、命名、错误处理与结构风险的只读评审 |
| `cpp-reviewer` | C/C++ 专项只读审查，覆盖 RAII、内存安全与惯用法 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `encoding-guard` | BOM 检测 + 非 UTF-8 字节序列检测 |
| PostToolUse Edit\|Write | `edit-loop-detector` | 无限编辑循环检测 |
| PostToolUse Edit\|Write | `large-edit-chunk-guard` | 过大单次编辑拦截 |
| PostToolUse Edit\|Write | `merge-conflict-guard` | 未解决合并冲突检测 |
| PostToolUse Edit\|Write | `debug-statement-guard` | 跨语言调试断点与调试输出检测 |
| PostToolUse Edit\|Write | `suppression-guard` | 拦截无理由的 ESLint disable / @ts-ignore 等抑制注释（带 `-- 原因：xxx` 放行） |
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

本目录收录**跨语言可复用**的通用方法论 skill 与守卫。语言/框架特定的检查属于对应的 `*-expert` 目录；仓库中的 `encoding-guard`、通用 `debug-statement-guard` 与跨语言 `file-budget-guard` 也只在这里维护。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```
