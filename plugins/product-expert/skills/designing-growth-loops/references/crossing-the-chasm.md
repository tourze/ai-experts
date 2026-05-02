
# 跨越鸿沟

## 适用场景
- 科技产品从早期采用者走向主流客户时，需要重构市场进入策略。
- 需要结合 [references/beachhead-selection.md](references/beachhead-selection.md)、[references/whole-product.md](references/whole-product.md)、[references/go-to-market.md](references/go-to-market.md) 设计推进路径。
- 讨论定位时可配合 [obviously-awesome](../obviously-awesome/SKILL.md)，讨论新市场时可配合 [blue-ocean-strategy](../blue-ocean-strategy/SKILL.md)。

## 核心约束
- 先选一个足够窄、痛点足够强、可被整包解决的 beachhead，再谈扩张。
- 主流市场购买的是“可落地方案”，不是“技术炫技”；whole product 必须写清。
- 不要同时追多个细分市场，否则组织、产品和销售都会失焦。

## 代码模式
```markdown
| 市场段 | 痛点强度 | 可达性 | 参考客户 | 是否 beachhead |
| --- | --- | --- | --- | --- |
```

## 检查清单
- [ ] 已界定 early adopter 与 mainstream 的差异。
- [ ] Beachhead、whole product、定位与销售打法彼此一致。
- [ ] 扩张顺序、相邻细分与资源需求已说明。
- [ ] 没有把“多打几个行业”误当成 GTM 策略。

## 反模式

### FAIL: 同时打多个垂类

```
A 轮融到 → 同时进军电商、医疗、教育、金融、零售
6 个月后每个垂类 5 个客户，无一续费
→ 没参考客户、没标杆、无 word-of-mouth
```

### PASS: Beachhead 优先

```
beachhead：DTC 新消费品牌（$5-50M ARR）
半年内拿下 30 家同质客户 → 互相介绍 → 标杆形成
一年后扩到相邻 beachhead（小型快消）
```

### FAIL: 功能 roadmap 当 GTM

```
GTM：Q1 SSO、Q2 多语言、Q3 API、Q4 AI 助手
→ 没说卖给谁、谁来买、怎么触达
```

### PASS: 围绕 beachhead 设计 whole product

```
beachhead：DTC 财务负责人
whole product：
- 核心：实时财务自动化
- 集成：Shopify / Stripe / QuickBooks
- 服务：DTC 财务模板 + 月度 office hour
- 销售：Shoptalk 大会 + DTC 创始人社群
```
