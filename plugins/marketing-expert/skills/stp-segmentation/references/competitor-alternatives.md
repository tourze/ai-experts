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
node scripts/comparison_matrix_builder.mjs --input matrix.json --markdown
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

### FAIL: 硬踩对手

```md
"X 是垃圾产品，赶紧迁过来！"
"X 永远做不到这些功能"
→ 用户："这家公司也太情绪化了"
→ 也可能引来 X 的法律函
```

### PASS: 客观对比

```md
| 场景 | X | 我方 |
| 5 人以下团队 | $50/月 起 | 免费 |
| 高级权限 | 仅企业版（$500/月起） | 标准版包含 |

X 适合：> 50 人 + 强合规需求
我方适合：5-50 人 + 快速落地

迁移路径（如果你正在用 X）：
1. 我方 CSV 导入工具支持 X 格式
2. 50 人以下首月免费
3. SSO 配置支持
```

### FAIL: 全功能表

```
[功能 vs 功能 vs 功能 × 200 行]
→ 用户："所以呢？"
```

### PASS: 场景 + 决策

```md
## 你正在用 X 的痛点（基于 X 用户访谈）
- 报表加载慢 30s
- 缺少 API 集成
- 培训成本高

## 我方解决方式
- 同样 dashboard 加载 < 3s（基准测试）
- 50+ 现成集成
- 30 分钟 onboarding 视频

## 谁不该迁移
- 已重度依赖 X 的某项独家功能（列具体哪些）
```