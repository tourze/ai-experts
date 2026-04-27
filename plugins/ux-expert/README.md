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

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 校验

```bash
python3 -m json.tool plugins/ux-expert/hooks/hooks.json >/dev/null
node --check plugins/ux-expert/hooks/dispatch.mjs
node --test plugins/ux-expert/tests/*.test.mjs
```
