## 异常层级

```
DomainException (abstract, extends RuntimeException)
├── ValidationException    — 输入不合法
├── BusinessRuleException  — 规则不允许（如重复邮箱）
└── ExternalServiceException — 第三方不可用
```

代码示例见 [patterns.md](./patterns.md)。

## 代码模式

代码示例见 [patterns.md](./patterns.md)。
