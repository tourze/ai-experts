# react-expert

React 与 Next.js 专家能力，覆盖组件组合、Hooks 模式、渲染性能优化、重渲染治理、Server Components（含 RSC 性能优化、数据瀑布并行化、缓存、序列化与 Server Actions 安全）与 App Router 全栈模式。

## Skills

| Skill | 用途 |
|-------|------|
| `detox-mobile-test` | 当用户要编写或排查 Detox E2E 测试、移动端自动化、flaky 测试、CI 设备启动或 matcher 等待问题时使用。 |
| `nextjs-developer` | Next.js App Router、Server Components、缓存、路由和部署风险 |
| `react-composable-components` | 小型、可组合、可定制的组件设计 |
| `react-hooks` | 内置 Hooks 规则与自定义 Hook 开发 |
| `react-native-design` | 当用户需要实现 RN 样式、导航结构、手势交互、Reanimated 动画、跨端布局或移动端视觉组件时使用。 |
| `react-native-js-performance` | 当用户要排查 JS thread 性能、掉帧、FPS、FlatList、FlashList、React Compiler、内存泄漏、动画抖动或 ScrollView 慢时使用。 |
| `react-native-metro-config` | 当用户要配置或排查 React Native Metro 打包器时使用。 |
| `react-native-platform-fork` | 当用户要组织 React Native 跨平台代码或配置平台分叉时使用。 |
| `react-native-turbomodule` | 当用户要创建或迁移 New Architecture TurboModule、TurboModuleRegistry、codegenConfig、JSI spec 或 typed native spec 时使用。 |
| `react-performance` | 记忆化、虚拟列表、代码分割、外部 store 订阅、derived state / transitions 等渲染性能治理（含 rules/ 规则索引与 advanced.md） |
| `react-server-components` | RSC 架构、服务端组件边界、Server Actions、streaming 渲染、RSC 性能优化、数据瀑布并行化、React.cache 去重、序列化开销治理 |

React Native 相关 skill 仍保留在本目录，用于兼容既有安装与路由。

## Agents

| Agent | 用途 |
|-------|------|
| `nextjs-reviewer` | 只读审查 Next.js App Router、Server Components、缓存、路由和部署风险 |
| `react-native-engineer` | 当需要端到端设计或实现 React Native 移动应用时使用——覆盖项目架构、导航设计、列表性能、TurboModule 原生模块、Metro 构建配置、平台分叉策略与 Detox E2E 测试。 |
| `react-native-reviewer` | 当需要只读审查 React Native 架构、导航、列表性能、JSI/Bridge、原生模块和平台分叉 时使用。 |
| `react-reviewer` | React 组件架构、Hooks、性能模式的只读评审 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| SessionStart | `env-detector` | 探测 React 版本、渲染目标与状态管理库 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 结构

- `hooks/`：1 个 SessionStart 环境探测守卫
- `agents/react-reviewer.md`：React 评审 agent
- `skills/*/SKILL.md`：中文 skill 入口
- `tests/`：skill 文档一致性校验

## 校验

```bash
node --test plugins/react-expert/tests/*.test.mjs
```
