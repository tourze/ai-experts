---
name: competitor-alternatives
description: "在需要编写竞品对比页、替代页或 VS 页面时使用，兼顾 SEO 捕获和销售辅助；适合 `X alternative`、`A vs B`、竞品迁移等场景。"
---

# 竞品对比页（competitor-alternatives）

## 适用场景
- 为特定竞品制作 `alternative`、`vs` 或迁移页。
- 需要同时服务搜索意图、销售答疑和产品定位。
- 需要把多家竞品的功能差异整理为可复用的内容模块。

## 核心约束
- 事实表述必须可核对，避免虚构对手能力或贬低式文案。
- 页面结构要支持复用，统一参考 [content-architecture](references/content-architecture.md)。
- 除功能表外，必须解释“差异为什么重要”，否则只是一张低价值清单。
- SEO 层面若涉及站点结构或关键词布局，可配合 [seo](../seo/SKILL.md) 与 [copy-editing](../copy-editing/SKILL.md)。

## 代码模式
- 用矩阵脚本整理功能对比：

```bash
python3 scripts/comparison_matrix_builder.py --input matrix.json --markdown
```

- `matrix.json` 结构：

```json
{
  "your_product": "YourProduct",
  "features": [
    {
      "name": "SSO / SAML",
      "category": "Security",
      "your_status": "full",
      "competitors": {"CompetitorA": "no", "CompetitorB": "partial"}
    }
  ]
}
```

- 页面文案骨架优先参考 [templates](references/templates.md)。

## 检查清单
- 是否写清楚目标关键词、页面意图和适用读者。
- 是否区分你更适合谁、对手更适合谁。
- 是否把功能差异落到真实业务场景。
- 是否保留更新入口，避免每个竞品页都单独维护一套事实。

## 反模式
- 用夸张措辞硬踩对手，牺牲可信度。
- 页面全是功能表，没有迁移动机、场景和决策建议。
- 把 SEO、销售、产品定位三种任务混在一段空泛文案里。
