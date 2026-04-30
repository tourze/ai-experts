# vue-expert

Vue 框架专家能力，聚焦 Vue 3 JavaScript 项目：`<script setup>`、Composition API、JSDoc 类型标注、Pinia 与 Vite 配置。

## 结构

- `hooks/`：1 个 PostToolUse Edit\|Write 守卫。
- `skills/vue-expert-js/`：主技能说明与 JSDoc / composable / 组件 / 状态管理 / 测试参考文档。
- `tests/`：文档结构与最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `vue-expert-js` | Vue 3 JavaScript 组件、vanilla JS composables、JSDoc 类型标注、Vite 配置 |

## Agents

| Agent | 用途 |
|-------|------|
| `vue-reviewer` | review Vue 3 Composition API usage, reactive patterns, component design, Pinia store architecture, Vue Router configuration, and template optimization without modifying any files |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/vue-expert/tests/*.test.mjs
```
