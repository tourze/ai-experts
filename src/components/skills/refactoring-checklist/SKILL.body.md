# 重构前安全检查清单

## 适用场景
- 用户要对现有代码做结构调整、抽取、合并、移动职责。
- 用户觉得代码"很乱"想整理但没想清楚具体做什么。
- 本 skill 只回答「能不能开始 / 怎么安全推进 / 怎么回滚」。
- 交叉引用：
  - 具体「该用哪个重构手法」（Extract Method / 异味分类）→ `architecture-expert/refactoring-patterns`。
  - 降低嵌套与函数复杂度的诊断 → `complexity-reducer`。
  - 审查结论触发的重构 → `code-review`。

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 重构 = 改结构不改行为。行为变更（bug 修复、新功能）必须另开提交。
- 没有测试覆盖的代码，先补表征测试再重构。
- 每步保持系统可运行、测试可通过。
- 范围必须提前确定，防止"顺手改"扩散。

## 准入四项
详细检查项见 [references/pre-checks.md](./references/pre-checks.md)。

1. **测试基线** — 有测试吗？可信吗？覆盖率多少？没有就先补。
2. **范围界定** — 明确要动什么、不动什么、影响哪些调用方。超过 5 个文件考虑分批。
3. **目标明确** — 一句话说清重构完变成什么样，收益是什么。
4. **回滚方案** — 干净分支、每步独立提交、知道怎么回到起点。

## 增量步骤循环
流程图见 [references/refactor-loop.dot](./references/refactor-loop.dot)。做一个小变更 → 跑测试 → 提交 → 重复。常见动作见 [references/incremental-actions.md](./references/incremental-actions.md)。

## 检查清单
- [ ] 有测试覆盖（或已补表征测试）
- [ ] 范围已界定，排除项已明确
- [ ] 在干净分支上操作，每步提交
- [ ] 重构提交不混入行为变更
- [ ] 重构后覆盖率不低于基线

## 纪律守卫

**Iron Law：没有测试覆盖的代码，不允许开始重构。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "这段代码很乱，先整理一下" | 先界定范围和目标，不要"先动手再说"。 |
| "顺手把这个 bug 也修了吧" | 重构和 bug 修复必须分开提交。搭车 = 无法回滚。 |
| "这个不需要测试，改动很小" | 越觉得安全越容易出事。跑测试只要几秒。 |
| "先改完再补测试" | 没有测试基线，你无法证明行为没变。先补测试。 |

完整的 Red Flags 表和 Rationalizations 对照表见 [references/discipline-guard.md](./references/discipline-guard.md)。

## 反模式

### FAIL: 重构搭车

```bash
git diff
# 50% 重命名 + 30% 修 bug + 20% 加新功能
git commit -m "refactor: 整理 + 修 bug"
→ 出问题：无法 revert 重构而保留 bug 修复
```

### PASS: 三类独立提交

```bash
git commit -m "refactor: extract OrderService"  # 仅结构
git commit -m "fix: race condition in payment"   # 仅修复
git commit -m "feat: support multi-currency"     # 仅新功能
→ 任一可独立 revert
```

### FAIL: 大爆炸提交

```
一个 commit 改 80 文件
→ 上线后某个细节挂了
→ 无法定位是哪一步引入
```

### PASS: 增量小步

```
每步 ≤ 5 文件 + 测试通过 + 提交
→ 最多 20 个小提交，每个独立可验
→ 出问题二分法快速定位
```
