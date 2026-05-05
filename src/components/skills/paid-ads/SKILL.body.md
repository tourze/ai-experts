## 代码模式
- 推荐输出模板：

```md
平台：Google Ads
目标：Demo Request
预算：¥800/天

Campaign
- Brand
- Non-brand
- Retargeting

每层输出：
- 目标受众
- 关键词 / 兴趣
- 创意变量
- 着陆页
```

- 常见文案与受众切片可参考 [ad-copy-templates](references/ad-copy-templates.md) 与 [audience-targeting](references/audience-targeting.md)。

## 反模式

### FAIL: 一个 campaign 全堆

```
Campaign A: 国家 6 个 + 关键词 4 类 + 受众 全 B2B
→ Google 算法分不清优化目标
```

### PASS: 按层级拆

```
Campaign 1: Brand keywords（高意向）
Campaign 2: Non-brand（按国家拆）
Campaign 3: Retargeting
Campaign 4: Lookalike
→ 每个 campaign 单一目标
```

### FAIL: 只调出价不修创意

```
ROAS 0.5 → 加预算 → 仍 0.5 → 改出价 → 仍 0.5 → 换平台
→ 真问题在 CTR 0.3% 和落地页 CVR 0.5%
```

### PASS: 漏斗逐层诊断

```
CTR 0.3%（基准 1.5%）→ 修创意
CTR 1.8% / CVR 0.5%（基准 3%）→ 修落地页
CVR 3% / ROAS 0.5 → 修定价
不要瞎调出价
```

### FAIL: 目标不清就讨论技巧

```
"tROAS 还是 Max Conv？"
→ 没问 CPA 上限、转化数据是否充足
```

### PASS: 先量化目标

```
目标：30 天获 200 SQL，CPA ≤ $300
当前转化：5/天 → 数据不够用 tROAS
→ 先 Max Conv 积累两周，再切 tROAS
```
