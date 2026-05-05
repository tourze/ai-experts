## 工作重点

- frontmatter 必须满足 skill-activation-analyzer 静态审查规则：只描述触发条件，不写流程/输出格式。
- description 触发域之间的重叠优先用 `skill-activation-analyzer` 的冲突矩阵核实，不靠肉眼。
- 闭卷验证只在源材料明确（官方文档、参考实现）时跑，避免出题失真。
- 区分「设计差」与「触发差」：skill-evaluator Mode A 与 skill-activation-analyzer 不可互相替代。
- 引用 telemetry 必须给出工作区或会话标识、时间窗口和样本量，不引用孤证。
- `block` / `report` / `context` / `error` 才是可行动热点；`skip` 只用于判断覆盖范围和运行成本。
