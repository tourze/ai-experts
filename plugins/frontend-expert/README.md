# frontend-expert

前端专家能力，覆盖性能、设计系统、响应式、交互设计、Figma 落地、shadcn/ui 接入与 Web 质量审计。

## 结构

- `hooks/`：1 个 SessionStart 环境探测守卫。
- `skills/`：前端设计与实现 skill
- `tests/`：回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `algo-visualization` | 当用户要把数据结构、算法或代码执行过程做成交互式教学可视化页面时使用。 |
| `baoyu-compress-image` | 当用户要压缩图片、转成 WebP 或导出更小的 PNG/JPEG 时使用。 |
| `bundle-optimization` | Bundle 体积治理：dynamic import、barrel imports、preload |
| `canvas-design` | 当用户要做海报、封面、艺术化静态画面、editorial poster、visual composition 或一页高完成度视觉作品时使用。 |
| `design-system-patterns` | 设计令牌、主题系统与组件架构 |
| `figma-implement-design` | Figma 设计稿转生产代码 |
| `frontend-design-review` | 前端界面与交互评审 |
| `i18n-localization` | 国际化与本地化治理 |
| `icon-retrieval` | 图标搜索与 SVG 检索 |
| `industry-design-presets` | 行业场景的视觉方向、配色与字体预设 |
| `interaction-design` | 微交互、状态反馈与动效编排 |
| `miniprogram-development` | 当用户提到微信小程序、小程序页面、组件、project.config.json、appid、真机预览、miniprogram-ci、CloudBase 或 wx.cloud 时使用。 |
| `modern-web-design` | 现代 Web 设计方向与实现原则 |
| `responsive-design` | 容器查询、流式排版与响应式布局 |
| `screenshot` | 当用户要截桌面、截窗口、截指定区域或做系统级截图时使用。 |
| `shadcn-ui` | shadcn/ui 初始化、迁移与定制 |
| `ux-heuristics` | 当用户需要诊断界面可用性问题或做启发式评估时使用（交互层：导航混乱、表单阻塞、信息架构复盘）。 |
| `ux-researcher-designer` | 当用户需要做用户研究、需求验证、persona 构建或设计复盘时使用（设计视角：访谈→persona→设计输入）。 |
| `ux-writing` | 按钮、错误、空态与引导微文案设计 |
| `web-performance-diagnosis` | 三段式跨层性能诊断（网络→渲染→运行时）、Core Web Vitals（LCP/INP/CLS）深度优化、质量审计、瀑布流消除、浏览器渲染模式，区分 lab 与 RUM 数据口径 |

## Agents

| Agent | 用途 |
|-------|------|
| `design-system-architect` | 搭建或重构设计令牌、主题与组件架构，融合 OKLCH 颜色、字体配对、Tailwind / shadcn-ui 与动效原则，可写盘 |
| `ux-reviewer` | 当需要审查界面可用性、交互设计质量、信息架构、微文案或设计还原度时使用——覆盖启发式评估、用户研究方法、设计系统一致性、响应式和国际化。只读分析，产出 UX 审查报告。 |
| `visual-producer` | 视觉资产制作：从概念到图像/视频生成、图表到压缩交付的完整视觉流水线 |
| `web-perf-engineer` | Web 前端性能诊断：Core Web Vitals、bundle、浏览器渲染、JS 热路径、React 渲染与 Server Components 优化 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/frontend-expert/tests/*.test.mjs
```
