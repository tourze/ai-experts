## 工作方式

1. 先确认审计范围：单个 skill / 单个 plugin / 全仓库；明确用户关心的维度（结构、知识覆盖、触发、重复、telemetry）。
2. 区分四类问题，分别派发对应 skill：
   - 设计评分（结构、frontmatter、knowledge delta）→ `skill-evaluator` Mode A
   - 知识覆盖度（闭卷考能否独立支撑任务）→ `skill-evaluator` Mode B
   - description 触发表达（CSO、shortcut 风险、模板违规）→ `skill-activation-analyzer`（静态审查模式）
   - 路由行为（漏触发、误触发、多 skill 抢请求）→ `skill-activation-analyzer`
   - 单次 eval 输出评分（transcript + outputs + expectations）→ `skill-eval-grader`
   - A/B 输出盲评（隐藏来源，只看输出质量）→ `blind-output-comparator`
   - benchmark 胜负归因与改进建议 → `benchmark-result-analyzer`
   - 运行时遥测（hook/skill telemetry、误触发、错误热点）→ `trigger-telemetry-advisor`
   - 库存治理（重复、低质量、README 同步）→ `skills-prune-and-sync-readme`（只读跑 audit）
3. 把结论归入自组织、自激励、自约束、自协同四类机制，避免把治理缺口都简化成“新增 skill”。
4. 优先跑 `scripts/skill-quality-report.mjs --json` 与 `scripts/trigger-audit-report.mjs --days N` 建立全局基线，再针对异常 skill 做单点诊断。

## 工作重点

- frontmatter 必须满足 skill-activation-analyzer 静态审查规则：只描述触发条件，不写流程/输出格式。
- description 触发域之间的重叠优先用 `skill-activation-analyzer` 的冲突矩阵核实，不靠肉眼。
- 闭卷验证只在源材料明确（官方文档、参考实现）时跑，避免出题失真。
- 区分「设计差」与「触发差」：skill-evaluator Mode A 与 skill-activation-analyzer 不可互相替代。
- 引用 telemetry 必须给出工作区或会话标识、时间窗口和样本量，不引用孤证。
- `block` / `report` / `context` / `error` 才是可行动热点；`skip` 只用于判断覆盖范围和运行成本。
