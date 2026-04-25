---
name: seo
description: "当用户要提升搜索可见性、修复技术 SEO、优化元数据、结构化数据、索引策略或 Search Console 问题时使用；AEO/GEO 另走 `aeo-geo`。"
---

# 搜索引擎优化（seo）

## 适用场景
- 审计页面是否可抓取、可索引、可规范化。
- 优化标题、描述、canonical、robots、sitemap 和结构化数据。
- 评估内容 E-E-A-T 信号和页面级 SEO 质量。
- 为内容页、产品页或栏目页补齐搜索可见性基础。

## 核心约束
- 先确认页面是否值得被索引，再谈标题和关键词。
- 技术 SEO 改动必须说明影响范围，尤其是 robots、canonical、noindex、重定向。
- 站点层级和 URL 规划配合 [site-architecture](../site-architecture/SKILL.md)；内容主题配合 [content-strategy](../content-strategy/SKILL.md)；AI 搜索引用配合 [aeo-geo](../aeo-geo/SKILL.md)。
- 不对排名结果做承诺；SEO 结论要区分"可执行项"和"结果预期"。
- 按站点类型使用对应检查项，见 [site-type-checklists](references/site-type-checklists.md)。

## 代码模式

输出按 `可抓取性 → 可索引性 → 页面语义 → E-E-A-T → 结构化数据 → 内链` 顺序组织。

```html
<link rel="canonical" href="https://example.com/page" />
<meta name="robots" content="index,follow" />
<script type="application/ld+json">{ ... }</script>
```

### E-E-A-T 审计框架

| 维度 | 检查要点 |
|------|----------|
| Experience | 一手经验展示、原始数据/洞察、真实案例 |
| Expertise | 作者资质可见、信息准确详细、来源有据 |
| Authoritativeness | 被同行引用、行业认证、作者页面存在 |
| Trustworthiness | HTTPS、联系方式、隐私政策、信息准确透明 |

### 规模化 SEO（Programmatic SEO）

当需要批量生成 SEO 页面时，参考 [programmatic-seo-playbooks](references/programmatic-seo-playbooks.md) 中的 12 种模式。核心原则：每页必须有独特价值，不只是换变量；优先使用自有数据；子目录优于子域名。

## 检查清单
- 是否明确索引策略和 canonical 策略。
- 是否检查标题/描述/H1/正文与搜索意图的一致性。
- 是否评估 E-E-A-T 四个维度的信号强度。
- 是否说明 sitemap、robots 和结构化数据的变更点。
- 是否按站点类型（SaaS/电商/内容/本地）使用对应检查项。
- 是否标注需要前端或内容团队配合的部分。

## 反模式

### FAIL: 关键词堆砌

```html
<title>最好的 CRM 系统 CRM 软件 CRM 推荐 免费 CRM</title>
```

### PASS: 搜索意图驱动

```html
<title>HubSpot vs Salesforce：50 人团队怎么选 CRM</title>
<meta name="description" content="对比功能、价格、集成与实施难度，附 2026 最新价格与真实案例。">
```

### FAIL: 改完不说回滚

```
把 /blog/* 加 noindex → 一周后流量暴跌 70%
```

### PASS: 变更清单 + 监控

```
变更：robots.txt 新增 Disallow: /draft/；sitemap 移除 /archive/* 203 条
回滚：git revert <commit>（生效 7-14 天）
监控：GSC Impressions 下降 >10% 立刻回滚
```
