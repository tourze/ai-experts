# Component Quality Standards

本文件描述新增或改造 skill/agent 时的质量标准。历史组件可以逐步迁移，但新增样例和代表性组件应优先符合这些规则。

## Checklist 问题化

`checklist` 应写成可回答、可判定的问题，而不是命令式待办。问题要能让维护者判断是否满足，并尽量绑定证据要求。

差：

- 运行相关测试。
- 检查边界输入。
- 确认没有直接编辑 dist。

好：

- 是否已运行相关测试，并在最终输出中报告真实结果？
- 边界输入是否已被 schema、类型守卫或明确合同收口？
- 是否只修改了 `src/components/` 源码，而没有直接编辑 `dist/` 生成产物？

构建校验会阻止明显命令式 checklist 项：以“运行、检查、确认、补充、更新、修复、添加、删除、生成、验证”开头且不含“是否/能否/有没有/？”的问题。

## Evals 场景化

`evals/` 是源码侧质量验证材料，不是 runtime reference；不得通过 `defineReference()` 登记，也不会复制到 `dist/*/skills/*/references/`。

新场景优先写入 `src/components/skills/<skill>/evals/scenarios.yaml`，保留现有 `cases.yaml` 触发评估兼容格式。最小模板：

```yaml
scenario_version: 1
cases:
  - id: scenario_id
    prompt: "触发任务或用户请求"
    trigger_expected: true
    expected_trigger:
      skills:
        - skill-id
      agents: []
    fixtures:
      - type: inline
        path: path/or/material.txt
        content: |
          输入材料或 fixture
    success_criteria:
      - "可审查的成功标准"
    must_report_evidence:
      - "最终输出必须报告的证据字段"
    prohibited_behaviors:
      - "不应出现的行为"
```

场景必须描述任务、期望触发的 skill/agent、输入材料、成功标准、必须报告的证据和失败约束；不要只放“资料”或泛泛 rubric。

## 输出证据化

`outputs`、agent `outputFormat` 和 `qualityStandards` 应声明模型最终要报告的可核查证据，而不是只要求“给出结论”。

差：

- 说明修复结果。
- 给出审查意见。

好：

- 输出应包含修改文件、关键决策、运行过的命令、真实测试结果、未验证项或残余风险。
- 每条发现必须包含文件/行号、触发条件、影响、修复方向；如果无发现，也要说明检查范围和未覆盖风险。

建议至少出现一种证据字段：证据、文件、命令、测试结果、行号、风险、未验证项、复现步骤。轻量校验函数覆盖新增样例，历史组件按代表性迁移逐步补齐。
