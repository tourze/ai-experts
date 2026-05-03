---
name: research-note-wrap
description: 当用户要把当前调研或分析会话压成高密度 Markdown 结论笔记时使用。
---

# 调研结论笔记

## 适用场景

- 调研、分析、技术选型、issue 排障会话末尾，把讨论沉淀成可复用的 Markdown 结论笔记。
- 输入是「当前对话已经产出的判断与依据」，不是 git 提交、不是已有多源 retrieval、不是外部会议/电话转写。
- 反场景路由：
  - coding 改完写 session journal → `git-expert:record-session`
  - 已有多批检索结果做来源分层综合
  - 外部会议/电话转写 → `meeting-expert:meeting-notes-and-actions`
  - 复盘本轮合作并沉淀经验 → `skill-expert:session-reflection`

## 核心约束

- 中文优先；技术标识符保留英文原样。
- 范围默认「当前会话」；仅在用户显式说「今天关于 xx 的相关会话」时扩展。
- **强制双步确认**：先对齐「主要问题」表 → 再对齐「核心结论」表 → 才允许落盘；任一阶段被驳回回到对应步骤重写。
- 表格承担密度：问题对比、结论对比、（必要时）实现位点；其后才是 `## 关键结论` 编号列表，禁流水账。
- 引用文件/函数/路径必须给出三件事：它做什么、为什么关键、如何支撑结论。
- 输出位置先查项目记忆文件（`CLAUDE.md` / `AGENTS.md` / `MEMORY.md`）的"调研笔记目录"约定；未定义则首次询问，并建议写回记忆文件。
- 文件名 `YYYY-MM-DD-<topic>.md`；topic 不明确用 `session-research`。
- 用户后续说「再调研 xx 写入笔记」「补充分析 xx」**默认追加**到现有笔记 `## 追加专题：xx` 段，不另开新文件。
- 表格列名对齐仓库 `CLAUDE.md` 的「证据点 / 方案对比 / 风险登记」口径，完整骨架见 [输出模板](references/output-template.md)。

## 代码模式

```text
1. 范围决策：默认 current-session；显式"今天 + 主题"才走 today-topic-synthesis
2. 输出位置决策：读记忆文件 → 没有就问 → 用户给出后建议写回记忆文件
3. Step 1: 草拟问题对比表（问题 | 现象/信号 | 核心判断 | 影响）→ 等用户确认主要问题
4. Step 2: 草拟结论对比表（主题 | 结论 | 依据 | 风险/边界）+ 关键结论编号列表 → 等用户确认结论
5. Step 3: 套用 references/output-template.md 落盘 → 回报绝对路径
```

跨会话场景第一版不做自动 transcript 检索；由用户提供具体会话或要点，frontmatter 标 `source: today-topic-synthesis`。

## 检查清单

- [ ] 范围已确定（current-session / today-topic-synthesis）。
- [ ] 输出路径来自记忆文件或已与用户当面确认。
- [ ] 主要问题表与核心结论表均已通过用户确认。
- [ ] 表格承担密度，`## 关键结论` 紧随其后。
- [ ] 引用的位点都给出了"它做什么 / 为什么关键 / 如何支撑结论"。
- [ ] 文件名匹配 `YYYY-MM-DD-<topic>.md`。
- [ ] 追加专题场景没有新建文件。

## 反模式

完整 FAIL/PASS 对照见 [反模式集](references/anti-patterns.md)。摘要：

| 反模式 | 摘要 | 正确做法 |
|---|---|---|
| 单步落盘 | 没确认就写文件 | 双步确认后落盘 |
| 流水账叙事 | 把对话过程照抄 | 表格承担密度 |
| 干甩 path:line | 只丢路径不解释 | 三件事都到位 |
| 错触发 | 把外部转写当输入 | 转手到 meeting-notes-and-actions |
