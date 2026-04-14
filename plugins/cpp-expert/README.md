# cpp-expert

C/C++ 开发专家插件，提供 C/C++ 调试语句检测、内存安全模式指南，以及源码 / 构建文件的编码与行数守护。

## 目录结构

- `.claude-plugin/plugin.json`：插件元数据。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 3 个 `PostToolUse Edit|Write` guard。
- `skills/`：`memory-safety-patterns`。

## Skills

| Skill | 用途 |
|-------|------|
| `memory-safety-patterns` | C/C++ 资源所有权、RAII、智能指针、C 边界清理模式 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `debug-statement-guard` | 仅检查 C/C++ 源文件中的净新增调试输出 |
| PostToolUse Edit\|Write | `encoding-guard` | 检查 C/C++ 源码、`CMakeLists.txt`、Makefile、`.clang-*` 等文本文件的 BOM / 非 UTF-8 |
| PostToolUse Edit\|Write | `file-budget-guard` | C/C++ 源码与构建脚本行数预算（源文件 800 行、头文件 500 行、CMake/Makefile 300 行） |

## 验证命令

在仓库根目录执行：

```bash
claude plugin validate plugins/cpp-expert
jq empty plugins/cpp-expert/.claude-plugin/plugin.json
jq empty plugins/cpp-expert/hooks/hooks.json
node --check plugins/cpp-expert/hooks/dispatch.mjs
for f in plugins/cpp-expert/hooks/post-tool-use/edit-write/*.mjs; do node --check "$f"; done
node --test plugins/cpp-expert/tests/*.test.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/cpp-expert
```
