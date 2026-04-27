# 外部记忆与高风险确认

## state.yaml 最小字段

```yaml
session_id: 2026-04-24-feature-xyz
current_phase: plan           # specify|plan|act|review|vault
action_count: 6               # 每 2 次触发一次 journal 追加
consecutive_failures: 0       # 到 3 必须停下
completion_promise: "checkout 全部测试绿 + 一次支付端到端成功"
```

## journal.md 条目格式

```markdown
## 2026-04-24T10:12:03Z — [phase:act] progress
已完成 src/checkout/payment.ts 的 stripe token 刷新逻辑；
`npm test -- --testPathPattern=checkout` 34/34 pass；
下一步：补 webhook 重放幂等。
```

事件类型建议：`progress` / `decision` / `uncertainty` / `failure` / `risk-confirmation` / `scope-change`。

## kb.md 结构（Vault 阶段写入）

```markdown
# Patterns
- <可复用代码模式 + 出处链接>

# Decisions
- <关键架构选择 + 当时的理由 + 何时该重新评估>

# Gotchas
- <踩的坑 + 解法 + 触发条件>
```

## 高风险（EHRB）显式确认清单

触发以下任一信号，**必须在进入 Act 之前拿到用户的显式 "yes"**，并把确认记录到 journal：

- 生产环境或生产数据
- 敏感数据（凭证、PII、token）
- 破坏性操作（删除、truncate、force push、drop）
- 计费 API 或有费用的外部调用
- 安全关键路径（认证、授权、加密、沙箱）

确认条目格式：

```markdown
## 2026-04-24T11:30:00Z — [phase:specify] risk-confirmation
风险：要在 prod 数据库上跑一次 ALTER TABLE，无法回滚。
方案：先在 staging dump 上 dry-run + 备份 + 维护窗口执行。
用户确认：yes（2026-04-24 11:28，原话："批准，按方案做"）。
```
