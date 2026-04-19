# thinking-expert

思维专家插件，覆盖思考陪跑、优先级判断、第一性原理、逆向推演、多视角审议、跨领域迁移和科研脑暴。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：9 个思维类技能，每个 `SKILL.md` 使用统一中文结构。
- `tests/`：manifest、dispatch、脚本语法与文档结构校验。

## Skills

| Skill | 用途 |
|-------|------|
| `thinking-partner` | 思考拍档（从混沌中理清局面） |
| `priority-judge` | 优先级判断（待办排序与行动决策） |
| `grill-me` | 追问到底（计划/设计的压力测试） |
| `consciousness-council` | 多视角 Mind Council 审议 |
| `first-principles-decomposer` | 第一性原理分解与重建 |
| `inversion-strategist` | 逆向思维（如何必然失败→反推） |
| `cross-pollination-engine` | 跨行业创意移植 |
| `what-if-oracle` | 多分支 What-If 情景推演 |
| `scientific-brainstorming` | 科学研究创意与探索 |

## Agents

| Agent | 用途 |
|-------|------|
| `strategic-thinker` | deep multi-perspective strategic thinking — combining first principles, inversion, scenario analysis, cross-industry analogies, and adversarial questioning to produce rigorous analysis on complex decisions |

## 校验

```bash
jq empty plugins/thinking-expert/.claude-plugin/plugin.json
jq empty plugins/thinking-expert/hooks/hooks.json
node --check plugins/thinking-expert/hooks/dispatch.mjs
node --test plugins/thinking-expert/tests/*.test.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/thinking-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install thinking-expert@ai-experts
claude plugin install thinking-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall thinking-expert
claude plugin uninstall thinking-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
