## 核心约束

- 先读真实测试代码，不凭猜测。
- 按六类衰退风险（T1-T6）逐项扫描，不遗漏维度。
- 每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。
- 按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。每个风险类型都有严重度指引和"不应标记"规则。
- 审查结束输出 **Test Health Score**（100 分制）。
- 无问题则明确说明——100 分合法。

## 审查维度
审查时必须读取 [references/test-decay-risks.md](./references/test-decay-risks.md)，按六类风险扫描：
- **T1 测试意图模糊** — 理解测试需要多少心智负担
- **T2 测试脆弱性** — 重构不改行为时测试会不会断
- **T3 测试重复** — 同一场景是否多处表达
- **T4 Mock 滥用** — 测试是否比被测行为更复杂
- **T5 覆盖幻觉** — 覆盖率是否真的保护了关键路径
- **T6 架构错配** — 测试结构是否反映风险分布

## 输出格式
读取 [references/health-score.md](./references/health-score.md)，按四要素格式输出，含 Test Health Score 和套件概览。

## 检查清单
- [ ] 已读取实际测试代码
- [ ] 六类风险（T1-T6）都扫描过
- [ ] 每条发现含四要素（Symptom / Source / Consequence / Remedy）
- [ ] 检查了各风险的"不应标记"规则，未误报
- [ ] 计算并输出 Test Health Score
- [ ] 未把测试风格偏好当成衰退风险

## 纪律守卫

**Iron Law：没有读取实际测试代码，不允许给出审查意见。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "测试通过了就没问题" | 通过只说明 mock 设置正确。T4 和 T5 专门检测这种幻觉。 |
| "覆盖率高就够了" | 覆盖率衡量执行了什么，不衡量验证了什么。查 T5。 |
| "测试多就是好" | 重复的测试不如没有。查 T3。 |
| "mock 多没关系" | mock > 3 个/测试是信号，不是标准。查 T4。 |

## 反模式

### FAIL: 泛泛评论

```
测试写得还行，但可以更好。
建议增加覆盖率，多测边界情况。
```

→ 没有 T1-T6 分类、没有代码证据、没有四要素。

### PASS: 四要素 + 风险分类

```
**[T4] Mock 验证替代行为验证** — `tests/order.test.ts:42`
- Symptom: 主断言是 expect(mockPayment.charge).toHaveBeenCalledWith(...)，
  未验证订单状态是否变为 'paid'
- Source: 测试验证的是 mock 调用而非业务结果——mock 正确不等于行为正确
- Consequence: 重构 charge 调用方式（如从回调改 await）后测试断裂，
  但真正的 bug（金额计算错误）不会被捕获
- Remedy: 改为断言 order.status === 'paid' 和 order.chargeId 存在；
  mock 仅保留外部支付网关边界
```
