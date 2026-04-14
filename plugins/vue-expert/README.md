# vue-expert

Vue 框架专家插件，聚焦 Vue 3 JavaScript 项目：`<script setup>`、Composition API、JSDoc 类型标注、Pinia 与 Vite 配置。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`、`hooks/hooks.json` 与配套依赖。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/dependency-check.mjs`。
- `skills/vue-expert-js/`：主技能说明与 JSDoc / composable / 组件 / 状态管理 / 测试参考文档。
- `tests/`：manifest、dispatch、依赖检查与文档结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `vue-expert-js` | Vue 3 JavaScript 组件、vanilla JS composables、JSDoc 类型标注、Vite 配置 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/vue-expert
```

本插件依赖 `javascript-expert` 提供通用 JavaScript 模式与测试补充；`SessionStart` 会在依赖不可见时给出非阻塞提示。

## 验证

```bash
claude plugin validate plugins/vue-expert
jq empty plugins/vue-expert/.claude-plugin/plugin.json
jq empty plugins/vue-expert/hooks/hooks.json
node --check plugins/vue-expert/hooks/dispatch.mjs
node --check plugins/vue-expert/hooks/session-start/dependency-check.mjs
node --test plugins/vue-expert/tests/*.test.mjs
```
