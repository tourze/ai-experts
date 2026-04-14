# windows-expert

Windows 专家插件，覆盖带安全边界的桌面自动化、Windows 内核分析，以及通过 Parallels Desktop 控制 Windows / Linux 客体。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/plugin-sanity.mjs`，用于结构自检。
- `skills/`：Windows UIA、内核安全、Parallels `prlctl` 控制等技能目录。
- `tests/`：manifest、dispatch、技能文档、脚本语法与 `prlctl_helper.py` 运行时回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `prlctl-vm-control` | 使用 `prlctl` 枚举、定位、控制 Parallels Desktop 虚拟机并在客体执行命令 |
| `windows-kernel-security` | Windows 内核对象、回调、VBS/HVCI、驱动边界与代码路径分析 |
| `windows-ui-automation` | 带权限分层与阻断策略的 UIA/Win32 桌面自动化 |

## Hooks

- `SessionStart`：校验 `plugin.json`、`hooks/hooks.json`、`hooks/dispatch.mjs`、`README.md` 与全部 `SKILL.md` 的结构、标题顺序和交叉引用。
- 设计原则：全部使用 `report`，不主动 `block`，保证插件加载路径保持 fail-open。

## 运行时依赖

- 通用：`node`、`python3`
- `prlctl-vm-control`：macOS + Parallels Desktop CLI `prlctl`
- `windows-ui-automation`：只在 Windows 环境真实执行 UIA / Win32 自动化代码

## 安装

```bash
claude --plugin-dir /path/to/plugins/windows-expert
```

## 验证

```bash
python3 -m json.tool plugins/windows-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/windows-expert/hooks/hooks.json >/dev/null
node --check plugins/windows-expert/hooks/dispatch.mjs
node --check plugins/windows-expert/hooks/session-start/plugin-sanity.mjs
find plugins/windows-expert -type f -name '*.py' -print0 | xargs -0 python3 -m py_compile
node --test plugins/windows-expert/tests/*.test.mjs
```
