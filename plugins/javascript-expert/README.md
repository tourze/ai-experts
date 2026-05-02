# javascript-expert

JavaScript 与 Vue 开发专家能力，提供语法检查、ESLint 代码质量守护、调试语句检测、文件预算守卫，以及现代 ES6+ / Jest / Vue 3 Composition API 实战技能。

## 结构

- `hooks/`：4 个本地 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：现代 JavaScript 模式、Jest 测试与 JS 微优化三项技能。
- `tests/`：hook 与 SKILL 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `modern-javascript-patterns` | 现代 ES6+ 特性（async/await、解构、展开运算符等） |
| `js-micro-optimization` | 热路径微优化（Set/Map 查找、迭代合并、DOM 批处理） |
| `javascript-typescript-jest` | Jest 测试最佳实践（含 mocking 策略、React Testing Library） |
| `vue-expert-js` | Vue 3 Composition API、响应式、组件设计、Pinia、Router 和模板性能 |

## Agents

| Agent | 用途 |
|-------|------|
| `javascript-reviewer` | perform a JavaScript-specific code review |
| `vue-reviewer` | 只读审查 Vue 3 Composition API、响应式、组件设计、Pinia、Router 和模板性能 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-javascript` | `node --check` 语法验证（`.js` / `.mjs` / `.cjs`） |
| PostToolUse Edit\|Write | `lint-eslint` | ESLint v9 代码质量检查 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | console.log / debugger 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/javascript-expert/tests/*.test.mjs
```
