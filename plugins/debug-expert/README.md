# debug-expert

调试专家插件，覆盖 LLDB/GDB 线程回溯、Chrome DevTools 页面调试与性能剖析，以及 `browser-use` 浏览器自动化。

## 结构

- `skills/`：4 个技能目录，分别面向桌面卡死分析、Chrome DevTools 调试、GDB 非阻塞 trace 和 `browser-use` CLI 自动化。
- `tests/`：自述文档与脚本语法的最小回归测试。
- `.mcp.json`：Chrome DevTools MCP 声明，由仓库根安装脚本统一同步。

## Skills

| Skill | 用途 |
|-------|------|
| `debug-lldb` | LLDB/GDB 线程回溯分析（死锁/挂起/UI 冻结） |
| `chrome-devtools` | Chrome DevTools 浏览器调试与性能分析 |
| `browser-use` | 浏览器自动化（测试/表单/截图/数据提取） |
| `gdb-nonblocking` | 当需要用 GDB 调试运行中的进程而不阻塞 agent 时使用；通过 named pipe + dprintf 实现非阻塞 trace。 |

## Agents

| Agent | 用途 |
|-------|------|
| `bug-investigator` | 只读排查 bug：结合代码、日志、堆栈与 git 历史定位问题根因 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find plugins/debug-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/debug-expert/tests/*.test.mjs
```
