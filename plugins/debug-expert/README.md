# debug-expert

调试专家插件，覆盖 LLDB/GDB 线程回溯、Chrome DevTools 页面调试与性能剖析，以及 `browser-use` 浏览器自动化。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：4 个技能目录，分别面向桌面卡死分析、Chrome DevTools 调试、GDB 非阻塞 trace 和 `browser-use` CLI 自动化。
- `tests/`：manifest、dispatch、hook、自述文档与脚本语法的最小回归测试。

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

## 安装

```bash
claude --plugin-dir /path/to/plugins/debug-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install debug-expert@ai-experts
claude plugin install debug-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall debug-expert
claude plugin uninstall debug-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
python3 -m json.tool plugins/debug-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/debug-expert/hooks/hooks.json >/dev/null
find plugins/debug-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
find plugins/debug-expert -name '*.sh' -print0 | xargs -0 -n1 bash -n
node --test plugins/debug-expert/tests/*.test.mjs
```
