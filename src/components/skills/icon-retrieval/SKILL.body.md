## 代码模式

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

```json
{
  "query": "document upload",
  "topK": 5,
  "count": 2,
  "results": [
    {
      "url": "https://example.com/icon.svg",
      "svg": "<svg ...>...</svg>"
    }
  ]
}
```

```tsx
// 使用前先把 SVG 放进统一 Icon 包装器，而不是在页面里到处内联。
<Icon size="md" color="var(--color-text-primary)" dangerouslySetInnerHTML={{ __html: svg }} />
```
