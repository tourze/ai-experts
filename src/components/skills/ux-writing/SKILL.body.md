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
