# cpp-expert

C/C++ 开发专家插件，提供 C/C++ 调试语句检测、内存安全模式指南，以及源码 / 构建文件的行数守护。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 与 2 个 `PostToolUse Edit|Write` guard。
- `skills/`：`memory-safety-patterns`。

## Skills

| Skill | 用途 |
|-------|------|
| `memory-safety-patterns` | C/C++ 资源所有权、RAII、智能指针、C 边界清理模式 |

## Agents

| Agent | 用途 |
|-------|------|
| `cpp-reviewer` | perform a C/C++-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `debug-statement-guard` | 仅检查 C/C++ 源文件中的净新增调试输出 |

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 验证命令

在仓库根目录执行：

```bash
claude plugin validate plugins/cpp-expert
jq empty plugins/cpp-expert/hooks/hooks.json
node --check plugins/cpp-expert/hooks/dispatch.mjs
for f in plugins/cpp-expert/hooks/post-tool-use/edit-write/*.mjs; do node --check "$f"; done
node --test plugins/cpp-expert/tests/*.test.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/cpp-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install cpp-expert@ai-experts
claude plugin install cpp-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall cpp-expert
claude plugin uninstall cpp-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
