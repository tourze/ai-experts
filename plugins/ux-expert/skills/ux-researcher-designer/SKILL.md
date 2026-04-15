---
name: ux-researcher-designer
description: 当用户需要做用户研究、需求验证、persona 构建或设计复盘时使用。适用于用户研究、需求验证、设计复盘，以及需要把访谈与行为数据收敛成可执行设计输入的场景。
---

# UX Researcher Designer

## 适用场景

- 要从访谈、问卷、埋点、客服记录中提炼 Persona，而不是凭感觉写角色卡。
- 要梳理端到端旅程，找出每一阶段的动作、触点、情绪和阻塞点。
- 要为新流程、新页面制定可用性测试计划和成功指标。
- 要把原始研究记录压成“发现 → 证据 → 建议”的交付物。
- 如果问题已经明确是界面启发式错误，先用 [ux-heuristics](../ux-heuristics/SKILL.md)；如果已进入视觉系统层，联动 [visual-design-foundations](../visual-design-foundations/SKILL.md)。
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

基于真实数据运行 [persona_generator.py](scripts/persona_generator.py)：

```bash
python3 scripts/persona_generator.py \
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

- 只做 1 到 2 次访谈就输出“标准 Persona”。
- 把用户自述、研究员推断和产品假设写成同一层级。
- 旅程图只画 happy path，不记录失败与恢复路径。
- 用“用户说喜欢”替代真实任务完成率与行为证据。
- 脚本只跑默认样例，却把结果当成真实研究交付。
