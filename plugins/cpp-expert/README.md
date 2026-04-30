# cpp-expert

C/C++ 开发专家能力，提供 C/C++ 调试语句检测、内存安全模式指南，以及源码 / 构建文件的行数守护。

## 目录结构

- `hooks/`：3 个 `PostToolUse Edit|Write` guard。
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

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 验证命令

在仓库根目录执行：

```bash
for f in plugins/cpp-expert/hooks/post-tool-use/edit-write/*.mjs; do node --check "$f"; done
node --test plugins/cpp-expert/tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

