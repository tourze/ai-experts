---
name: trigger-telemetry-advisor
description: 当需要根据当前会话或当前工作区的 hook/skill telemetry、decisions.jsonl、触发审计数据生成改进建议报告时使用；适合分析 hooks/skill 的误触发、漏触发、热点、错误、噪音和后续治理 backlog。
---

# Trigger Telemetry Advisor

把 `decisions.jsonl` 和触发审计结果转成可执行的仓库改进报告。目标不是复述统计表，而是给出下一步应该改哪些 hook、skill description、eval cases 或 telemetry 配置。

## 快速流程

1. 确认当前目录是 `ai-experts` 仓库根目录，或向上查找 `scripts/trigger-audit-report.mjs`。
2. 默认分析当前工作区：

```bash
node scripts/trigger-audit-report.mjs --json --workspace "$PWD" --days 7 --top 20
```

3. 如果用户明确要看当前会话，优先使用最新会话记录：

```bash
node scripts/trigger-audit-report.mjs --json --workspace "$PWD" --session latest --days 7 --top 20
```

如果输出提示旧日志缺少 `session_id/transcript_path`，再重新运行不带 `--session` 的当前工作区分析，并在报告中把“无法会话级过滤”列为数据质量限制。

4. 如果用户要看多个并行 cc/codex 进程或跨目录总览，改用：

```bash
node scripts/trigger-audit-report.mjs --json --all-workspaces --days 7 --top 20
```

5. 需要人工校准 hook 热点时，再跑表格版：

```bash
node scripts/hook-telemetry-report.mjs --workspace "$PWD" --days 7
```

## 分析口径

- Hook runtime 是权威运行记录：重点看 `error`、`block`、高频 `report`、同一目标反复命中、异常耗时。
- Skill 原生激活不能直接从 Claude/Codex 路由层获得权威事件；运行时侧使用 `skill-expert` Stop hook 自动记录的路由声明、已调用/未调用和下一步推荐作为审计信号，静态侧继续结合 description、evals/cases.yaml 和触发域重叠。
- `--session latest` 依赖 telemetry 中的 `session_id` 或 `transcript_path`。旧日志没有这些字段时，退回当前工作区时间窗分析，不要假装已有会话级证据。
- `skip` 默认自动记录，用于判断 hook 是否实际被调用；如果用户设置 `AI_EXPERTS_HOOK_AUDIT=0`，报告中要把 skip 缺失列为数据质量限制。

## 报告格式

输出一份简短但可执行的报告，固定包含：

1. **范围与数据质量**：工作区/会话、天数、记录数、是否有旧格式日志、是否缺 runtime 数据。
2. **关键发现**：按 `P0/P1/P2` 排序，每条都要带证据，例如 hook 名、decision 计数、文件路径、skill 名或缺失 eval 数。
3. **建议改动**：把发现落到具体文件或任务，如补 eval 反例、收窄 description、修 hook 异常、降低 report 噪音、调整 telemetry 配置。
4. **验证命令**：列出修改后要跑的最小命令。

## 判断规则

- `error > 0`：优先定位对应 hook，读取 `plugins/<plugin>/hooks/<subdir>/*.mjs` 和测试；这是 P0/P1。
- 同一 hook 对同一目标多次 `block`：怀疑误拦或用户工作流不顺，检查规则是否过宽，必要时补 allowlist 或测试。
- 高频 `report` 但用户无法行动：这是噪音，建议改成更具体的 reason、降级为 `context`，或收窄触发条件。
- 缺 `evals/cases.yaml` 的 skill：建议至少补 2 个正例和 1 个反例，优先补 telemetry 或用户问题中出现过的高频领域。
- 多轮缺少 Skill 路由声明：优先检查 `skill-routing-reminder` 是否注入、模型是否遵守、Stop gate 是否只覆盖下一步推荐而未覆盖路由声明。
- 多轮 skill 命中但未调用：优先检查 description 是否过宽、路由摘要是否流于形式、是否需要把相关任务交给更具体的 skill。
- 同插件 skill 触发域重叠：不要建议合并 skill；优先给 description 增加排他条件和对照反例。
- telemetry 记录为 0：先建议验证安装、环境变量、工作区分桶路径和 `AI_EXPERTS_HOOK_TELEMETRY`，不要推断 hook/skill 健康。

## Guardrails

- 不要在分析阶段清理或轮转 telemetry；`--purge` 只在用户明确要求清理时使用。
- 不要把 telemetry 中的完整命令、prompt 或路径原样贴进面向外部的报告；必要时脱敏。
- 不要只输出“补测试/优化描述”这类泛化建议。每条建议必须能追到具体数据或具体文件。
