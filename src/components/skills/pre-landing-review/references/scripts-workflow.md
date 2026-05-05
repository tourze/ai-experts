# 脚本工作流（确定性步骤交给脚本，判断保留 prose）

设计原则：固定输出（diff 收集、报告渲染）由 `scripts/` 提供确定性实现；
severity 分级、是否阻断、措辞和用户三选一沟通由你判断，不脚本化。

> 命令中的 `scripts/...` 路径相对本 skill 根目录解析（与 Anthropic Agent Skills spec 一致）。
> 调用前自行拼接 SKILL.md 所在目录的绝对路径，无需 cwd 切换到仓库根。

## 步骤 1：用 `collect_diff.mjs` 锁定审查范围

```bash
node scripts/collect_diff.mjs --base origin/main > /tmp/pre-landing-diff.json
```

输出 JSON 字段：`files`（变更文件列表）、`numstat`（增删行）、`stat`（人类可读摘要）。
依据 `files` 决定要 `git diff origin/main... -- <file>` 深读哪些文件——禁止跳过这一步直接判断。

## 步骤 2：判断（这一步必须由你做，禁止脚本化）

读 [checklist.md](./checklist.md) + 实际 diff，对每个变更点判定：

- 是阻断项还是建议项（参考 [discipline-guard.md](./discipline-guard.md) 的 Red Flags / Rationalizations 表）
- severity 标签（P0 / P1 / 高风险 / 中等 …）
- 用户选项措辞（默认 `立即修复 / 确认风险 / 误报`，特殊场景可调整）

把结果整理成 findings JSON：

```json
{
  "verdict": "BLOCKED",
  "blocking": [
    { "id": "B1", "severity": "高风险", "file": "src/order/service.ts", "line": 88,
      "issue": "事务内调用外部支付接口",
      "risk": "高并发下会放大锁等待并导致重试风暴",
      "options": ["立即修复", "确认风险", "误报"] }
  ],
  "informational": [
    { "id": "I1", "file": "src/order/util.ts", "issue": "魔法数 86400", "note": "建议提取常量" }
  ],
  "release_conditions": ["支付事务拆段", "为补偿任务补幂等测试"]
}
```

## 步骤 3：用 `render_report.mjs` 输出标准报告

```bash
node scripts/render_report.mjs --input /tmp/findings.json
```

脚本固定输出三段：阻断项、建议项、门禁结论；保证跨次审查格式一致，
节省你拼 markdown 的 token，并避免漏掉「用户三选一」与「放行条件」字段。
