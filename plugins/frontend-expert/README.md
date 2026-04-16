# frontend-expert

前端专家插件，覆盖性能、设计系统、响应式、交互设计、Figma 落地、shadcn/ui 接入与 Web 质量审计。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：17 个前端设计与实现 skill
- `tests/`：manifest、dispatch、脚本回归测试

## Skills

| Skill | 用途 |
| --- | --- |
| `browser-rendering-patterns` | Hydration、resource hints、content-visibility、事件监听优化 |
| `bundle-optimization` | Bundle 体积治理：dynamic import、barrel imports、preload |
| `core-web-vitals` | LCP / INP / CLS 优化 |
| `design-system-patterns` | 设计令牌、主题系统与组件架构 |
| `figma-implement-design` | Figma 设计稿转生产代码 |
| `frontend-design-review` | 前端界面与交互评审 |
| `i18n-localization` | 国际化与本地化治理 |
| `icon-retrieval` | 图标搜索与 SVG 检索 |
| `interaction-design` | 微交互、状态反馈与动效编排 |
| `lottie-animations` | Lottie / dotLottie 动画接入 |
| `modern-web-design` | 现代 Web 设计方向与实现原则 |
| `refactoring-ui` | 视觉层级、间距、配色与深度修复 |
| `responsive-design` | 容器查询、流式排版与响应式布局 |
| `shadcn-ui` | shadcn/ui 初始化、迁移与定制 |
| `tailwind-design-system` | Tailwind CSS v4 设计系统 |
| `web-design-guidelines` | Web 平台规范与无障碍底线 |
| `web-quality-audit` | 网站质量审计（性能 / a11y / SEO / best practices） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/frontend-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install frontend-expert@ai-experts
claude plugin install frontend-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall frontend-expert
claude plugin uninstall frontend-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
jq empty plugins/frontend-expert/.claude-plugin/plugin.json
jq empty plugins/frontend-expert/hooks/hooks.json
node --check plugins/frontend-expert/hooks/dispatch.mjs
node --test plugins/frontend-expert/tests/*.test.mjs
```
