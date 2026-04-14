# javascript-expert

JavaScript 开发专家插件，提供语法检查、ESLint 代码质量守护、调试语句检测、编码守卫，以及现代 ES6+ / Jest 实战技能。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 5 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：现代 JavaScript 模式与 Jest 测试两项技能。
- `tests/`：manifest、dispatch、hook 与 SKILL 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `modern-javascript-patterns` | 现代 ES6+ 特性（async/await、解构、展开运算符等） |
| `javascript-typescript-jest` | Jest 测试最佳实践（含 mocking 策略、React Testing Library） |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-javascript` | `node --check` 语法验证（`.js` / `.mjs` / `.cjs`） |
| PostToolUse Edit\|Write | `lint-eslint` | ESLint v9 代码质量检查 |
| PostToolUse Edit\|Write | `debug-statement-guard` | console.log / debugger 检测 |
| PostToolUse Edit\|Write | `encoding-guard` | 文件编码检查（BOM / 非 UTF-8） |
| PostToolUse Edit\|Write | `file-budget-guard` | JS 文件行数预算（500 行） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/javascript-expert
```

建议同时安装 `typescript-expert` 插件以获得完整的 JS/TS 开发体验。

## 验证

```bash
claude plugin validate plugins/javascript-expert
jq empty plugins/javascript-expert/.claude-plugin/plugin.json
jq empty plugins/javascript-expert/hooks/hooks.json
node --check plugins/javascript-expert/hooks/dispatch.mjs
node --test plugins/javascript-expert/tests/*.test.mjs
```
