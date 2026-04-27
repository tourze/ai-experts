# react-expert

React Web 专家插件，覆盖组件组合、Hooks 模式、渲染性能优化、重渲染治理、Server Components 与服务端优化模式。

## Skills

| Skill | 用途 |
|-------|------|
| `react-composable-components` | 小型、可组合、可定制的组件设计 |
| `react-hooks` | 内置 Hooks 规则与自定义 Hook 开发 |
| `react-performance` | 记忆化、虚拟列表、代码分割、外部 store 订阅、derived state / transitions 等渲染性能治理（含 rules/ 规则索引与 advanced.md） |
| `react-server-components` | React Server Components 服务端渲染 |
| `react-server-optimization` | RSC 数据获取、缓存、序列化与 Server Actions 安全 |

React Native 相关 skill 已拆分至 [react-native-expert](../react-native-expert/README.md)。

## Agents

| Agent | 用途 |
|-------|------|
| `react-reviewer` | React 组件架构、Hooks、性能模式的只读评审 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| SessionStart | `env-detector` | 探测 React 版本、渲染目标与状态管理库 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 结构

- `hooks/hooks.json`：SessionStart 环境探测
- `agents/react-reviewer.md`：React 评审 agent
- `skills/*/SKILL.md`：中文 skill 入口
- `tests/`：manifest、dispatch 与 skill 文档一致性校验

## 校验

```bash
node --check plugins/react-expert/hooks/dispatch.mjs
node --test plugins/react-expert/tests/*.test.mjs
```
