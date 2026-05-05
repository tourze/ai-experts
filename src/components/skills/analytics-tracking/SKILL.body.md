## 代码模式
- 使用生成器快速产出初版埋点方案：

```bash
node scripts/tracking_plan_generator.mjs input.json --json
```

- `input.json` 至少包含：

```json
{
  "business_type": "saas",
  "key_pages": [{"name": "Pricing", "path": "/pricing"}],
  "conversion_actions": [{"name": "Signup", "type": "registration", "value": 0}],
  "paid_channels": ["google_ads", "meta"],
  "consent_required": true
}
```

- 参考资料： [event-taxonomy-guide](references/event-taxonomy-guide.md)、[gtm-patterns](references/gtm-patterns.md)、[debugging-playbook](references/debugging-playbook.md)。

## 检查清单
- 是否列出了主转化、微转化、用户属性和事件属性。
- 是否说明每个事件的触发时机、去重规则和负责人。
- 是否覆盖 Consent、DebugView、Preview、广告平台回传的验证路径。
- 是否避免了同义事件并存，例如 `signup_complete` 与 `signup_completed`。

## 反模式

### FAIL: 全埋

```
“先把所有按钮点击都埋进 GA4，以后再说”
→ 200 个事件 / 无 owner / 命名混乱
→ 6 个月后没人知道哪个事件是真业务转化
```

### PASS: 业务漏斗驱动

```
1. 主转化：signup_completed（必埋）
2. 微转化：pricing_viewed, demo_requested
3. 用户属性：plan_tier, account_age_days
→ 每个事件都对应一个分析问题
→ ≤ 30 个核心事件，可维护
```

### FAIL: 同义事件并存

```
- signup_complete（旧版埋的）
- signup_completed（新版改名）
- user_signup（A/B 实验时另埋）
→ Looker 报表合不到一起
```

### PASS: 命名 taxonomy + 迁移

```
统一规则：{object}_{action_past_tense}
标准：signup_completed
旧事件：标 deprecated → 等 90 天数据 backfill → 移除
```
