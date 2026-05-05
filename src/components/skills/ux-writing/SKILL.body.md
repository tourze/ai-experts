## 适用场景

- 按钮标签（Submit / Save / Continue 还是具体动词）
- 错误消息、空态、表单 helper、确认对话框
- Onboarding 首次提示、敏感操作措辞（删除/支付/注销）
- 与 `product-design-critic` 联动评审文案。

## 核心约束

- **按钮动词化**：写按下之后发生什么。`Submit` → `Create account` / `Send invoice`。
- **错误三要素**：what + why + fix。不要只说 "Invalid"。
- **空态是教学机会**：解释这是什么 + 为什么空 + 下一步怎么办。
- **Placeholder 不是 label**：placeholder 在输入后消失，永远配真 label。
- **措辞承担后果**：`Delete forever` 比 `Remove` 诚实；扣费按钮要给金额和频率。
- **减字不减义**：每个词都要有工作。`Please click here to continue` → `Continue`。
- **大小写与标点一致**：全产品 Title Case 或 Sentence case 选一种。

## 实施步骤

1. 盘出场景：按钮/错误/空态/Helper/确认/Toast/敬告。
2. 按场景查 [references/copy-patterns.md](references/copy-patterns.md) 模板。
3. 重写：动词化按钮、具体化错误、教学化空态。
4. 声音统一：正式/友好/技术/权威三选一。
5. i18n 预审：留 30% 膨胀余量，不做字符串拼接。

## 代码模式

### FAIL：通用动词 + 生硬错误 + 消极空态

```tsx
<Button>Submit</Button>
<Alert>Error. Please try again.</Alert>
<EmptyState>No items found.</EmptyState>
<Button variant="danger">Delete</Button>
```

→ Submit 不说明"交付什么"；Error 无根因无出路；空当故障；Delete 不告知不可逆。

### PASS：动词化 + what-why-fix + 教学空态 + 后果诚实

```tsx
<Button>Create account</Button>
<Alert>
  <strong>Couldn't send invoice.</strong> Email looks invalid.
  <a href="#email">Check and retry</a>.
</Alert>
<EmptyState>
  <h3>No invoices yet</h3>
  <p>They'll appear here. Add a client to start.</p>
  <Button>Add your first client</Button>
</EmptyState>
<Button variant="danger">Delete project forever</Button>
```

→ 按钮说明结果；错误给 what+why+fix；空态教学+下一步 CTA；删除明示不可逆。

## 验证清单

- [ ] 按钮是**动词 + 名词**，不用 Submit/OK/Confirm。
- [ ] 错误同时说 **what / why / fix**。
- [ ] 空态给"这是什么 + 下一步 CTA"，不止 "No results"。
- [ ] Placeholder 和真 label 共存，不替代。
- [ ] 敏感操作措辞**反映真实后果**。
- [ ] 全产品大小写 / 标点 / 人称统一。
- [ ] i18n 友好：不字符串拼接，留 30% 膨胀空间。
- [ ] 无 AI 腔（"Please kindly" / "Effortlessly" / "thrilled to..."）。
- [ ] 配合 `product-design-critic` 的行业反模式。

## 反模式

### FAIL: 字符串拼接 / Placeholder 当 label

```tsx
<p>{"You have " + n + " items"}</p>  // 复数崩
<input placeholder="邮箱" />            // 输入后消失，屏读器读不到
<Alert>Something went wrong</Alert>   // 通用错误
```

### PASS: ICU + label + what-why-fix

```tsx
<p>{t('cart.itemCount', { count: n })}</p>  // ICU plural
<label htmlFor="email">邮箱</label>
<input id="email" placeholder="you@example.com" />
<Alert>无法发送邀请。邮箱格式不正确（例：name@company.com）</Alert>
```

### FAIL: AI 客套话 / 硬译

```
"We're thrilled to help you on your journey ✨"
"Oops! Looks like something went sideways..."
→ 中文场景直译："哎呀！似乎有些东西出错了..." 不自然
```

### PASS: 直接 + 本地化重写

```
英文："Sent. We'll review within 24h."
中文："已发送。我们 24 小时内回复。"
→ 各语言独立写，不用模板硬译
```

## 参考资料

- [references/copy-patterns.md](references/copy-patterns.md) — 按钮/错误/空态/确认/Toast/敏感操作模板
- `product-design-critic`
- [web-design-guidelines](../modern-web-design/SKILL.md)
- [i18n-localization](../i18n-localization/SKILL.md)
