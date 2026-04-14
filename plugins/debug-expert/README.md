# debug-expert

调试专家插件，覆盖 LLDB/GDB 线程回溯、Chrome DevTools 页面调试与性能剖析，以及 `browser-use` 浏览器自动化。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/plugin-sanity.mjs`。
- `skills/`：3 个技能目录，分别面向桌面卡死分析、Chrome DevTools 调试和 `browser-use` CLI 自动化。
- `tests/`：manifest、dispatch、hook、自述文档与脚本语法的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `debug-lldb` | LLDB/GDB 线程回溯分析（死锁/挂起/UI 冻结） |
| `chrome-devtools` | Chrome DevTools 浏览器调试与性能分析 |
| `browser-use` | 浏览器自动化（测试/表单/截图/数据提取） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/debug-expert
```

## Hooks

- `SessionStart`：运行插件自检，确认 `plugin.json`、`hooks/hooks.json`、`hooks/dispatch.mjs` 与各个 `SKILL.md` 文件完整存在。
- 设计原则：只 `report` 不 `block`；即使 hook 自身异常，也不影响插件被加载。

## 验证

```bash
python3 -m json.tool plugins/debug-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/debug-expert/hooks/hooks.json >/dev/null
find plugins/debug-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
find plugins/debug-expert -name '*.sh' -print0 | xargs -0 -n1 bash -n
node --test plugins/debug-expert/tests/*.test.mjs
```
