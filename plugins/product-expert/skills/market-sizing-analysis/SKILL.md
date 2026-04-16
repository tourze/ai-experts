---
name: market-sizing-analysis
description: 当用户要计算 TAM/SAM/SOM、验证市场空间、支撑商业计划或融资叙事时使用；支持 top-down、bottom-up 和 value theory 三种方法。
---

# 市场规模分析

## 适用场景
- 创业立项、融资材料、年度规划或新市场机会评估。
- 需要参考 [references/data-sources.md](references/data-sources.md) 与 [examples/saas-market-sizing.md](examples/saas-market-sizing.md)。
- 与客户画像或融资故事联动时，可配合 [startup-icp-definer](../startup-icp-definer/SKILL.md) 和 [fundraise-advisor](../fundraise-advisor/SKILL.md)。

## 核心约束
- 同时给出方法、假设和数据来源，不允许只报一个大数字。
- TAM/SAM/SOM 要口径一致，避免一个按用户数、一个按收入口径混算。
- 对新市场或新类别，优先写假设边界和不确定性，而不是装作数字很精确。

## 代码模式
```markdown
| 方法 | 假设 | 公式 | 结果 |
| --- | --- | --- | --- |
| Top-down | ... | 市场总盘子 × 可服务比例 | ... |
```

## 检查清单
- [ ] 已说明数据来源、年份、地区和口径。
- [ ] 至少使用两种方法交叉验证结果。
- [ ] SAM/SOM 与渠道能力、ICP 和资源约束一致。
- [ ] 对不确定性和关键敏感参数有说明。

## 反模式

### FAIL: 全球总盘 = TAM

```
"全球 SaaS 市场 1.5 万亿美元 → TAM = 1.5T"
→ 投资人："你的产品全球可服务比例是多少？"
→ 答不上来 → deck 失败
```

### PASS: top-down + bottom-up 交叉

```
Top-down:
- 全球 CRM 市场 100B
- 我方定位中小企业（30%）= 30B
- 中文区（20%）= 6B → SAM
- 3 年内可触达（5%）= 300M → SOM

Bottom-up:
- 中国注册中小企业 1500 万
- 目标行业（贸易/电商，10%）= 150 万
- 付费意愿 15% × ARPA $200 = 4500 万 → SOM 验证

两个数字相互检验，差太多说明假设有误
```

### FAIL: 漏定价/地域差

```
"中国市场 + 美国 SaaS 价格 = 1B 机会"
→ 中国客户付费意愿 1/5 美国
→ 真实 TAM 至少缩 80%
```

### PASS: 显式假设

```
TAM = N × Price
- N（潜在客户数）= 来源 / 年份 / 口径
- Price（实际可收）= 中国市场 = 美国 × 0.2
所有数字带敏感性区间：保守 / 中位 / 乐观
```
