---
name: model-first-reasoning
description: 当用户明确要求 model-first、MFR、formal model、先建模后实现，或任务涉及状态机、约束系统、复杂规则、需要先冻结领域模型再编码时使用。
---

# model-first-reasoning

## 适用场景

- 功能复杂，直接编码容易引入隐含状态、漏掉约束或发明接口。
- 任务包含显式状态转换、权限矩阵、调度规则、工作流编排、约束求解。
- 用户要求先建模型、先写约束、先确认 requirement trace，再进入实现阶段。
- 相关资源：[MODEL_TEMPLATE.json](MODEL_TEMPLATE.json)、[scripts/validate-model.py](scripts/validate-model.py)。
- 相关 skill：[llm-evaluation](../llm-evaluation/SKILL.md)、[prompt-lab](../prompt-lab/SKILL.md)。

## 核心约束

- Phase 1 只产出模型，不写实现代码。
- Phase 2 只能在 Phase 1 已冻结的实体、状态、动作、约束内实现；如果模型不够，必须先返回 `MODEL INCOMPLETE`。
- 每个用户需求都要能映射到 `goal`、`constraint`、`action` 三者之一。
- 进入编码前必须运行结构校验；`unknowns` 不为空时，停在 Phase 1。

## 代码模式

```bash
python3 plugins/data-ai-expert/skills/model-first-reasoning/scripts/validate-model.py \
  plugins/data-ai-expert/skills/model-first-reasoning/MODEL_TEMPLATE.json
```

```json
{
  "deliverable": { "description": "Refund workflow" },
  "actions": [
    {
      "name": "approve_refund",
      "preconditions": ["request.status == pending"],
      "effects": ["request.status = approved"]
    }
  ],
  "constraints": [
    { "id": "C1", "statement": "Approved refund cannot be approved twice" }
  ]
}
```

## 检查清单

- 用户需求是否都被映射进 `goal` / `constraint` / `action`。
- 是否存在实现阶段才会冒出来的新实体或新状态。
- `unknowns` 是否已经清零。
- 是否已经运行 [scripts/validate-model.py](scripts/validate-model.py)。
- 进入实现后，验证方案是否交给 [llm-evaluation](../llm-evaluation/SKILL.md) 或现有测试体系覆盖。

## 反模式

- 一边建模一边写代码，最后模型只是实现后的注释副本。
- 模型里不写约束，指望开发阶段“看着办”。
- 校验器提示 `unknowns` 仍然继续实现。
- 把 prompt 优化、文案组织等非建模问题塞进 MFR 流程。
