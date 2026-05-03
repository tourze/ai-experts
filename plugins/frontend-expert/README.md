# frontend-expert

前端专家能力，覆盖性能、设计系统、响应式、交互设计、Figma 落地、shadcn/ui 接入与 Web 质量审计。

## 结构

- `hooks/`：1 个 SessionStart 环境探测守卫。
- `skills/`：前端设计与实现 skill
- `tests/`：回归测试

## Skills

| Skill | 用途 |
|-------|------|
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
| `web-performance-diagnosis` | 三段式跨层性能诊断（网络→渲染→运行时）、质量审计、瀑布流消除、浏览器渲染模式，区分 lab 与 RUM 数据口径 |

## Agents

| Agent | 用途 |
|-------|------|
| `visual-producer` | 视觉资产制作：从概念到图像/视频生成、图表到压缩交付的完整视觉流水线 |
| `ux-reviewer` | 当需要审查界面可用性、交互设计质量、信息架构、微文案或设计还原度时使用——覆盖启发式评估、用户研究方法、设计系统一致性、响应式和国际化。只读分析，产出 UX 审查报告。 |
| `design-system-architect` | 搭建或重构设计令牌、主题与组件架构，融合 OKLCH 颜色、字体配对、Tailwind / shadcn-ui 与动效原则，可写盘 |
| `web-perf-engineer` | Web 前端性能诊断：Core Web Vitals、bundle、浏览器渲染、JS 热路径、React 渲染与 Server Components 优化 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/frontend-expert/tests/*.test.mjs
```
