---
name: seo
description: "在需要提升搜索可见性、修复技术 SEO、优化元数据、结构化数据与索引策略时使用；若任务是站点结构规划，可配合 `site-architecture`。"
---

# 搜索引擎优化（seo）

## 适用场景
- 审计页面是否可抓取、可索引、可规范化。
- 优化标题、描述、canonical、robots、sitemap 和结构化数据。
- 为内容页、产品页或栏目页补齐搜索可见性基础。

## 核心约束
- 先确认页面是否值得被索引，再谈标题和关键词。
- 技术 SEO 改动必须说明影响范围，尤其是 robots、canonical、noindex、重定向。
- 站点层级、内链和 URL 规划与 SEO 强相关，必要时配合 [site-architecture](../site-architecture/SKILL.md)；内容主题层面配合 [content-strategy](../content-strategy/SKILL.md)。
- 不对不存在的数据或排名结果做承诺；SEO 结论要区分“可执行项”和“结果预期”。

## 代码模式
- 常见实现片段：

```html
<link rel="canonical" href="https://example.com/page" />
<meta name="robots" content="index,follow" />
<script type="application/ld+json">{ ... }</script>
```

- 输出时建议按 `可抓取性 → 可索引性 → 页面语义 → 结构化数据 → 内链` 顺序组织。

## 检查清单
- 是否明确页面的索引策略和 canonical 策略。
- 是否检查了标题、描述、H1、正文与搜索意图的一致性。
- 是否说明 sitemap、robots 和结构化数据的变更点。
- 是否标注需要前端或内容团队配合的部分。

## 反模式

### FAIL: 关键词堆砌

```html
<title>最好的 CRM 系统 CRM 软件 CRM 推荐 免费 CRM 企业 CRM</title>
<meta name="description" content="CRM CRM CRM，最好的 CRM...">
```

→ 搜索引擎识别为低质量，反而降权。

### PASS: 搜索意图驱动

```html
<title>HubSpot vs Salesforce：50 人团队怎么选 CRM</title>
<meta name="description" content="对比功能、价格、集成与实施难度，附 2026 最新价格与真实团队案例。">
```

### FAIL: 改完不说回滚

```
把 /blog/* 加 noindex + canonical 指向 www
→ 一周后流量暴跌 70%，不知道改过什么
```

### PASS: 变更清单 + 监控

```markdown
变更（2026-04-16）：
- robots.txt 新增 Disallow: /draft/
- sitemap 移除 /archive/* 共 203 条
回滚：git revert <commit>（生效 7-14 天）
监控：GSC Impressions 下降 >10% 立刻回滚
```
