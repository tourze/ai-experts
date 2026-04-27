# frontend-expert

前端专家插件，覆盖性能、设计系统、响应式、交互设计、Figma 落地、shadcn/ui 接入与 Web 质量审计。

## 结构

- `hooks/`：1 个 SessionStart 环境探测守卫。
- `skills/`：前端设计与实现 skill
- `tests/`：脚本回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `browser-rendering-patterns` | Hydration、resource hints、content-visibility、事件监听优化 |
| `bundle-optimization` | Bundle 体积治理：dynamic import、barrel imports、preload |
| `color-oklch-theory` | OKLCH 颜色系统、色阶设计与暗色模式策略 |
| `core-web-vitals` | LCP / INP / CLS 优化 |
| `design-system-patterns` | 设计令牌、主题系统与组件架构 |
| `figma-implement-design` | Figma 设计稿转生产代码 |
| `font-pairing-library` | 标题/正文字体组合与字体风格选择 |
| `frontend-design-review` | 前端界面与交互评审 |
| `i18n-localization` | 国际化与本地化治理 |
| `icon-retrieval` | 图标搜索与 SVG 检索 |
| `industry-design-presets` | 行业场景的视觉方向、配色与字体预设 |
| `interaction-design` | 微交互、状态反馈与动效编排 |
| `lottie-animations` | Lottie / dotLottie 动画接入 |
| `modern-web-design` | 现代 Web 设计方向与实现原则 |
| `motion-design-theory` | 动效节奏、easing、reduced-motion 与场景判断 |
| `refactoring-ui` | 视觉层级、间距、配色与深度修复 |
| `responsive-design` | 容器查询、流式排版与响应式布局 |
| `shadcn-ui` | shadcn/ui 初始化、迁移与定制 |
| `tailwind-design-system` | Tailwind CSS v4 设计系统 |
| `ux-writing` | 按钮、错误、空态与引导微文案设计 |
| `web-design-guidelines` | Web 平台规范与无障碍底线 |
| `web-quality-audit` | 网站质量审计（性能 / a11y / SEO / best practices） |

## Agents

| Agent | 用途 |
|-------|------|
| `ui-reviewer` | 前端界面与代码只读评审：可访问性、性能、响应式、组件结构与 UI 规范 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/frontend-expert/tests/*.test.mjs
```
