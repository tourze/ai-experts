# react-expert

React 生态专家插件，覆盖组件组合、Hooks 模式、性能优化、Server Components 和 React Native 跨平台开发。

## Skills

| Skill | 用途 |
|-------|------|
| `react-composable-components` | 小型、可组合、可定制的组件设计 |
| `react-hooks` | 内置 Hooks 规则与自定义 Hook 开发 |
| `react-performance` | 记忆化、虚拟列表、代码分割等性能优化 |
| `react-render-performance` | 最小化外部状态引起的不必要重渲染 |
| `react-server-components` | React Server Components 服务端渲染 |
| `react-native-best-practices` | React Native FPS/TTI/包体积优化 |
| `react-native-design` | React Native 样式、导航、Reanimated 动画 |
| `react-native-macos` | React Native macOS 桌面应用 |
| `upgrading-react-native` | React Native 版本升级（rn-diff-purge） |
| `vercel-react-best-practices` | Vercel 工程团队的 React/Next.js 性能指南 |
| `detox-mobile-test` | React Native E2E 测试（Detox） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/react-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install react-expert@ai-experts
claude plugin install react-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall react-expert
claude plugin uninstall react-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 结构

- `.claude-plugin/plugin.json`：插件 manifest，显式声明 `skills/` 与 `hooks/hooks.json`
- `hooks/hooks.json`：保留插件 hooks 入口配置
- `skills/*/SKILL.md`：中文 skill 入口，统一使用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」
- `tests/`：manifest、dispatch 与 skill 文档一致性校验

## 校验

```bash
node --check plugins/react-expert/hooks/dispatch.mjs
node --test plugins/react-expert/tests/*.test.mjs
```
