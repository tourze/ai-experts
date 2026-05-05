# UX Researcher Designer

## 适用场景

- 要从访谈、问卷、埋点、客服记录中提炼 Persona，而不是凭感觉写角色卡。
- 要梳理端到端旅程，找出每一阶段的动作、触点、情绪和阻塞点。
- 要为新流程、新页面制定可用性测试计划和成功指标。
- 要把原始研究记录压成“发现 → 证据 → 建议”的交付物。
- 如果问题已经明确是界面启发式错误，先用 [ux-heuristics](../ux-heuristics/SKILL.md)。
- 工具、模板与方法细节分别在 [persona-methodology](references/persona-methodology.md)、[journey-mapping-guide](references/journey-mapping-guide.md)、[usability-testing-frameworks](references/usability-testing-frameworks.md)、[research-plan-template](assets/research_plan_template.md)。

## 核心约束

- 没有真实数据就明确说“假设版”，不要伪装成已验证 Persona。
- Persona 至少要说明数据来源、样本量、信心等级和推断边界。
- 访谈原话、行为事实、研究推断必须分层呈现，不能混写。
- 旅程图先定义范围：用户类型、目标、起点、终点、时间跨度。
- 可用性测试任务必须写成场景，不要写成“点击这里、再点那里”的操作说明。
- 使用脚本时优先传入真实 JSON 数据；只有演示场景才使用 `--sample`。

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

## 检查清单

- [ ] Persona 至少包含样本量、数据来源、信心等级。
- [ ] 痛点有频次或证据，不是凭印象列举。
- [ ] 研究结论能追溯到原始访谈、行为数据或支持记录。
- [ ] 旅程图的范围、目标和成功标准已写清楚。
- [ ] 可用性测试任务是“场景+目标+成功条件”，而不是操作脚本。
- [ ] 建议项已经按影响面、严重度、可解性排序。
- [ ] 需要设计落地时，已把输出交给相关 skill 或前端实现团队。

## 反模式

### FAIL: 2 次访谈出 Persona

```
访谈 2 个人 → 输出 “30% 用户重视隐私”
→ 样本太少，结论是噪声
```

### PASS: 显式样本 + 信心等级

```json
{
  "persona": "Privacy-conscious Pro",
  "sample_size": 32,
  "interview_count": 8,
  "confidence_level": "medium",
  "caveats": ["北美样本为主 / 40+ 年龄段代表不足"]
}
```

### FAIL: 自述 = 事实

```
访谈：”你会为这个功能付费吗？”
用户：”当然会！”
→ 输出：”目标用户付费意愿高”
→ 上线后付费率 < 2%
```

### PASS: 看行为而非意愿

```
访谈 + 量化：
- 说会付费：80%
- 实际用过类似付费产品：20%
- 过去 3 个月付费 SaaS 数量：平均 1.2 个
→ 付费意愿结论：中低（基于行为）
```

### FAIL: 只 happy path

```md
## 用户旅程：注册 → 激活 → 付费
- 注册：填表
- 激活：点邮件
- 付费：选套餐
→ 全是顺利路径
```

### PASS: 失败与恢复

```md
| 阶段 | happy | 失败 | 恢复 |
| 注册 | 填表成功 | 邮箱已被占用 | 提示+登录 CTA |
| 激活 | 邮件到 | 邮件未收 | 30s 后可重发 |
| 付费 | 支付成功 | 卡拒付 | 显式原因+换卡 |
```
