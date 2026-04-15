---
name: description-cso-audit
description: 当需要批量审查 skill description 的触发准确性、检测 Claude 走捷径风险、优化 description 以提升 skill 命中率时使用。
---

# Description CSO Audit

CSO = Claude Search Optimization. Claude 根据 skill 的 `description` 字段决定是否调用该 skill。
测试表明：**Claude 会把 description 当快捷路线，按描述摘要执行，跳过 SKILL.md 正文的完整流程。**

因此 description 只能包含 **触发条件**（什么时候用），绝不能包含工作流、方法、输出格式。

## 审查流程

### Step 1: 运行自动扫描

```bash
python3 <SKILL_DIR>/scripts/cso_audit.py [--plugins-dir <path>] [--fix-preview] [--json]
```

- 默认扫描 `plugins/` 下所有 `SKILL.md`
- `--fix-preview` 输出每个违规 description 的修复建议（不写文件）
- `--json` 输出 JSON 格式完整报告到 stdout

### Step 2: 审查违规分类

脚本检测 6 类违规：

| 类型 | 风险 | 说明 |
|------|------|------|
| `workflow_leak` | **Critical** | description 泄露了步骤/流程/覆盖范围，Claude 会按此走捷径 |
| `output_leak` | **Critical** | description 包含输出产物/格式，属于 SKILL.md 内容 |
| `missing_trigger` | High | 缺少 "当...时使用" / "在...时使用" 的触发条件句式 |
| `tool_leak` | Medium | 包含具体工具/库/命令名，过早缩小触发范围 |
| `too_long` | Medium | 超过 200 字符，token 浪费且可能含非触发信息 |
| `too_short` | Low | 低于 30 字符，触发覆盖不足 |

### Step 3: 逐条修复

对每个违规 description，按以下原则改写：

**合格 description 的结构**：
```
当 [用户意图/场景/症状] 时使用。
```

**禁止出现**：
- "覆盖 X、Y、Z"（覆盖范围 → 写进 SKILL.md）
- "按 N 步/阶段推进"（工作流 → 写进 SKILL.md）
- "输出/重点输出 X"（产物 → 写进 SKILL.md）
- "强调先...再..."（方法 → 写进 SKILL.md）
- 具体数字（"106 条规则""7 个维度"）
- 具体工具名（Ruff, pytest, STRIDE 等作为触发词的除外）

**允许出现**：
- 触发场景（"当用户要做 X 时"）
- 触发关键词（"英文触发词包括 X, Y, Z"）
- 排他指引（"如果只要 X，改用 `other-skill`"）

### Step 4: 验证修复

修复后重新运行脚本，确认 pass rate 达标：
- 目标：>90% pass rate
- Critical violations（workflow_leak + output_leak）: 0

改写示例见 `references/rewrite-examples.md`。
