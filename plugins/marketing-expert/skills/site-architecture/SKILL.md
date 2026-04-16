---
name: site-architecture
description: "在需要规划或重构网站层级、导航、URL 结构和内链关系时使用；若任务转向页面 SEO 细节，配合 `seo`。"
---

# 站点架构（site-architecture）

## 适用场景
- 规划新站的页面层级、导航与 URL 模式。
- 重构老站时，需要处理内容埋得太深、导航过重或内链混乱的问题。
- 需要把商业目标、用户路径和搜索结构统一起来。

## 核心约束
- 先定义网站目标和主要受众，再讨论目录和页面命名。
- 架构决策必须同时考虑可发现性、可扩展性和 SEO，不只看导航美观。
- URL、导航、内链、栏目页必须成套设计，不能只改其中一层。
- 若任务进入标题、canonical、结构化数据等页面级优化，切到 [seo](../seo/SKILL.md)；若要规划内容体系，配合 [content-strategy](../content-strategy/SKILL.md)。

## 代码模式
- 推荐输出模板：

```md
L0: /
L1: /product /pricing /blog /docs
L2: /product/analytics /blog/revenue-ops /docs/getting-started

导航：
- 主导航：Product / Pricing / Blog / Docs
- 次导航：Use cases / Templates / Compare
```

- 复杂站点可借助 [site-type-templates](references/site-type-templates.md)、[navigation-patterns](references/navigation-patterns.md) 和 [mermaid-templates](references/mermaid-templates.md) 输出结构图。

## 检查清单
- 是否明确核心受众和顶层入口。
- 是否控制了重要页面的点击深度。
- 是否给出 URL 命名规则、栏目页职责和内链策略。
- 是否考虑旧 URL 迁移与重定向影响。

## 反模式

### FAIL: 只画 sitemap

```
[一张漂亮 mermaid sitemap]
→ "为什么 /pricing 在第二级？" → 答不上
→ "/blog 下分类规则是什么？" → 答不上
```

### PASS: 每层有目标

```md
L0 /：3 秒说服访客继续
L1 /pricing：转化（购买决策）
L1 /docs：减少售前疑问 + 留住已购用户
L1 /blog：SEO 引流 + 教育
L2 /pricing/enterprise：高客单专属，独立设计
L2 /blog/{category}：SEO 长尾汇聚

每层服务一个明确动作
```

### FAIL: 关键入口埋深

```
首页 → 产品 → 行业 → 子行业 → 案例 → 立即试用
共 5 次点击才能注册
→ 80% 用户中途流失
```

### PASS: ≤ 3 步主路径

```
首页 → 注册（1 步，CTA 全屏可见）
首页 → 定价 → 注册（2 步）
首页 → 案例 → 注册（2 步）
任何关键转化路径不超过 3 步
```

### FAIL: 导航过载

```
顶部导航：Home / Product / Solutions / Industries /
Pricing / Customers / Resources / Blog / Docs / Company / About /
Careers / Contact / Login / Sign Up
→ 14 项 → 移动端崩 / 用户找不到东西
```

### PASS: 5-7 项 + 二级菜单

```
顶部：Product | Solutions | Pricing | Customers | Resources | [Login][Sign Up]
- Product 鼠标悬停 → 分类列表
- Resources → Blog / Docs / Help
- Company / Careers / Contact 移到 Footer
```
