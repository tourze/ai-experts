# 阶段门禁 Checklist 与 Red Flags

## 阶段门禁

### Specify → Plan

- [ ] 五维总分 ≥9
- [ ] 所有 0 分维度已写 UNCERTAIN/ASSUMPTION
- [ ] journal 里有一句"完成承诺"
- [ ] 若高风险，已拿到显式确认

### Plan → Act（Quick 模式可跳 Plan，但仍需满足 bullet 3）

- [ ] 任务拆到 2-5 分钟粒度
- [ ] 每个任务有验证命令
- [ ] 依赖关系和顺序明确

### Act → Review

- [ ] 所有原子任务的验证命令全部新鲜运行过
- [ ] 没有跳过失败重试规则（1 → 2 → 3 停）
- [ ] 每 2 次工具调用都有 journal 追加

### Review → Vault

- [ ] 对照"完成承诺"逐条核对过
- [ ] 全量测试跑过一次（非子集）
- [ ] Plan 之外的改动已记录或已回退

### Vault 出口

- [ ] 至少一条 Pattern / Decision / Gotcha 写入 `.sparv/kb.md`
- [ ] state.yaml 的 current_phase 置为 vault 并保留给下次参考

## Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|---|---|
| "需求大概懂了，先写代码" | Spec 没过门禁，大概率返工 |
| "这任务太小，跳过 Plan 吧" | 检查 Quick 模式三个条件，都满足才行 |
| "journal 等做完一起补" | 做完一起补 = 记不清 = 失效 |
| "再试一次就好" | 数一下：是不是第 3 次了？ |
| "高风险但我很确定没事" | EHRB 规则没有"除非" |
| "顺手改了点别的" | 要么回退要么写进 journal |
| "Review 就是走形式" | Review 不通过不能 Vault |
