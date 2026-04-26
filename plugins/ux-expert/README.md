# ux-expert

UX 设计专家插件，覆盖启发式可用性评估、用户研究方法和视觉设计基础。

## 结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：3 个中文化 skill，统一采用“适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式”结构。
- `tests/`：manifest、dispatch、hooks、scripts、skill 文档校验。

## Skills

| Skill | 用途 |
|-------|------|
| `ux-heuristics` | 启发式可用性评估与改进建议 |
| `ux-researcher-designer` | 数据驱动 UX 研究与设计工具包 |
| `visual-design-foundations` | 排版/色彩/间距/图标设计原则 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/ux-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install ux-expert@ai-experts
claude plugin install ux-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall ux-expert
claude plugin uninstall ux-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

建议同时安装 `frontend-expert` 插件，以便在界面实现与 UX 评审之间来回切换。

## 校验

```bash
python3 -m json.tool plugins/ux-expert/hooks/hooks.json >/dev/null
node --check plugins/ux-expert/hooks/dispatch.mjs
node --test plugins/ux-expert/tests/*.test.mjs
```
