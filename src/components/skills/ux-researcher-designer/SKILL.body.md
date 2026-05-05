## 代码模式

Persona 输入建议使用对象数组，字段保持稳定且能追溯来源：

```json
[
  {
    "user_id": "user_001",
    "age": 31,
    "usage_frequency": "daily",
    "features_used": ["dashboard", "reports", "export", "share"],
    "primary_device": "desktop",
    "usage_context": "work",
    "tech_proficiency": 8,
    "location_type": "urban",
    "occupation_category": "operations",
    "education_level": "bachelor",
    "pain_points": ["slow loading", "confusing UI"]
  }
]
```

基于真实数据运行 [persona_generator.mjs](scripts/persona_generator.mjs)：

```bash
node scripts/persona_generator.mjs \
  --input ./users.json \
  --interviews ./interviews.json \
  --output-format json
```

Persona 输出里优先保留以下结构，方便团队复核：

```json
{
  "name": "Alex，高效操作型用户",
  "archetype": "power_user",
  "data_points": {
    "sample_size": 32,
    "interview_count": 6,
    "confidence_level": "high"
  },
  "frustrations": [
    {
      "issue": "slow loading",
      "count": 14
    }
  ]
}
```

旅程与研究结论建议遵循以下最小骨架：

- `stage`: 当前阶段名称
- `actions`: 用户具体在做什么
- `touchpoints`: 用户和系统在哪些界面或渠道接触
- `emotions`: 情绪强弱或波动原因
- `pain_points`: 具体阻塞
- `opportunities`: 优先修复点
