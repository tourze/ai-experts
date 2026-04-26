# javascript-expert

JavaScript 开发专家插件，提供语法检查、ESLint 代码质量守护、调试语句检测、文件预算守卫，以及现代 ES6+ / Jest 实战技能。

## 结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 与 2 个本地 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：现代 JavaScript 模式、Jest 测试与 JS 微优化三项技能。
- `tests/`：manifest、dispatch、hook 与 SKILL 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `modern-javascript-patterns` | 现代 ES6+ 特性（async/await、解构、展开运算符等） |
| `js-micro-optimization` | 热路径微优化（Set/Map 查找、迭代合并、DOM 批处理） |
| `javascript-typescript-jest` | Jest 测试最佳实践（含 mocking 策略、React Testing Library） |

## Agents

| Agent | 用途 |
|-------|------|
| `javascript-reviewer` | perform a JavaScript-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-javascript` | `node --check` 语法验证（`.js` / `.mjs` / `.cjs`） |
| PostToolUse Edit\|Write | `lint-eslint` | ESLint v9 代码质量检查 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | console.log / debugger 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 安装

```bash
claude --plugin-dir /path/to/plugins/javascript-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install javascript-expert@ai-experts
claude plugin install javascript-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall javascript-expert
claude plugin uninstall javascript-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

建议同时安装 `typescript-expert` 插件以获得完整的 JS/TS 开发体验。

## 验证

```bash
claude plugin validate plugins/javascript-expert
jq empty plugins/javascript-expert/hooks/hooks.json
node --check plugins/javascript-expert/hooks/dispatch.mjs
node --test plugins/javascript-expert/tests/*.test.mjs
```
