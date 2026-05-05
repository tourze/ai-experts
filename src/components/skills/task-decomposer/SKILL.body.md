## 代码模式
- 拆解策略、依赖建模、边界清单和 sizing 参考 `references/*.md`。
- 默认分成 Foundation / Core Logic / Integration / Polish 四阶段。
- 输出中建议带任务表、依赖箭头、风险标记和测试等级。

### Execution Contract 模式

当用户要求生成/设计/拆解可交给子代理或多 agent 执行的计划，或提到“分波计划”“handoff”“execution contract generation”时，除常规任务表外，追加一个可复制的合同块。合同只描述计划，不执行任务。

如果用户要求执行、派遣、启动 worker、run/execute 现有合同或“现在按合同开工”，不要使用本模式；转交 `subagent-driven-development`。

```json
{
  "goal": "one sentence outcome",
  "waves": [
    {
      "id": "W1",
      "purpose": "explore | implement | verify | fix",
      "tasks": [
        {
          "id": "T001",
          "intent": "task outcome, not micro-steps",
          "read_scope": ["path/or/glob"],
          "write_scope": ["path/or/glob"],
          "depends_on": [],
          "acceptance_refs": ["A1"]
        }
      ]
    }
  ],
  "acceptance": [
    {
      "id": "A1",
      "must": "observable requirement",
      "evidence_type": "command | diff | artifact | manual",
      "command": "optional verification command"
    }
  ]
}
```

合同规则：
- `write_scope: []` 表示只读探索，可与其他只读任务并行。
- 同一 wave 内任意两个任务的 `write_scope` 不能重叠；重叠时拆到不同 wave 或合并成一个任务。
- 每个实现任务至少绑定一个 `acceptance_refs`；没有验收引用的实现任务不可交给子代理。
- `acceptance.command` 只放真实可运行的验证命令；不能用源码 grep 伪装运行时测试。
