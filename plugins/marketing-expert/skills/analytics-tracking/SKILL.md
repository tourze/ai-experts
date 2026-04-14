---
name: analytics-tracking
description: "在需要规划、审计或排查 GA4/GTM 埋点时使用，覆盖事件命名、转化定义、参数设计和数据质量；若重点是活动 ROI 分析，改用 `campaign-analytics`。"
metadata:
  version: 1.0.0
---

# 埋点与追踪（analytics-tracking）

## 适用场景
- 从零搭建 GA4 / GTM 埋点方案。
- 审计现有事件是否漏记、重记、命名混乱或参数失真。
- 排查“Preview 里触发了，但 GA4 没收 / Ads 没认”的问题。

## 核心约束
- 事件命名必须稳定且可复用，优先遵循 [event-taxonomy-guide](references/event-taxonomy-guide.md)。
- 先画业务漏斗和关键转化，再决定事件与参数，不要先埋再想用途。
- Consent、内部流量过滤、跨域追踪要在方案层面一次说明，不能等上线后补洞。
- 若用户要解释广告投放成效而不是修埋点，转到 [campaign-analytics](../campaign-analytics/SKILL.md)。

## 代码模式
- 使用生成器快速产出初版埋点方案：

```bash
python3 scripts/tracking_plan_generator.py input.json --json
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
- 把“看起来重要”的一切都埋成事件，最后没人能用。
- 把广告分析问题误判为埋点问题，或反之。
- 只给事件名，不给参数、触发器和验证方式。
