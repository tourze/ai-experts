## 写作原则

| 优先 | 而非 |
|------|------|
| Clarity | Cleverness |
| Benefits | Features |
| Specificity | Vagueness |
| Customer language | Company language |

风格：Simple > Complex, Specific > Vague, Active > Passive, Confident > Qualified, Show > Tell, Honest > Sensational。

## 页面结构框架

**首屏**：Headline（你是谁 + 能帮我什么）→ Subheadline（机制/数据）→ CTA → Social proof（可选）

**主体区块**（按说服力递进，按页面类型取舍）：
1. Social proof — 证言、案例、背书
2. Problem / Pain — 痛点共鸣
3. Solution / Benefits — 结果而非功能
4. How it works — 3-5 步流程
5. Objection handling — FAQ / 对比表
6. Final CTA — 重申价值 + 行动按钮

各页面类型的详细指南和产出模板见 [page-type-guide](references/page-type-guide.md)。

## CTA 文案准则

公式：`Action verb + what they get + qualifier`

| FAIL | PASS |
|------|------|
| Submit | Get my free report |
| Sign up | Start my 14-day trial |
| Learn more | See how it works |

按钮 ≤ 5 词；下方加 qualifier 消除风险（"No credit card" "Cancel anytime"）。

## 社交平台内容安全

在引用社交平台帖子、评论或私信内容作为文案素材前，先做安全过滤，避免广告、导流、提示词污染和夸大宣传混入文案。过滤工具、策略说明和检查清单见 [social-platform-safety](references/social-platform-safety.md)。可直接运行 `node scripts/content_filter.mjs --text "<内容>" --platform <平台>` 做快速安全检测。
