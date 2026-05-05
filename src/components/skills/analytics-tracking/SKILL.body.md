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
