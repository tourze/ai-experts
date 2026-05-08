## 准入四项
详细检查项见 [references/pre-checks.md](./pre-checks.md)。

1. **测试基线** — 有测试吗？可信吗？覆盖率多少？没有就先补。
2. **范围界定** — 明确要动什么、不动什么、影响哪些调用方。超过 5 个文件考虑分批。
3. **目标明确** — 一句话说清重构完变成什么样，收益是什么。
4. **回滚方案** — 干净分支、每步独立提交、知道怎么回到起点。

## 增量步骤循环
流程图见 [references/refactor-loop.dot](./refactor-loop.dot)。做一个小变更 → 跑测试 → 提交 → 重复。常见动作见 [references/incremental-actions.md](./incremental-actions.md)。

## 纪律守卫

**Iron Law：没有测试覆盖的代码，不允许开始重构。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "这段代码很乱，先整理一下" | 先界定范围和目标，不要"先动手再说"。 |
| "顺手把这个 bug 也修了吧" | 重构和 bug 修复必须分开提交。搭车 = 无法回滚。 |
| "这个不需要测试，改动很小" | 越觉得安全越容易出事。跑测试只要几秒。 |
| "先改完再补测试" | 没有测试基线，你无法证明行为没变。先补测试。 |

完整的 Red Flags 表和 Rationalizations 对照表见 [references/discipline-guard.md](./discipline-guard.md)。
