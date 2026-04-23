---
name: verification-loop
description: 当需要设计自动化验证循环、确保 agent 在所有检查通过后才能退出、或防止 agent 过早声称完成时使用。
---

# 验证循环

## 适用场景

- 需要让 agent 在"实现→验证→修复→再验证"的循环中工作，直到所有检查通过。
- 防止 agent 过早声称"已完成"但实际 lint/test/typecheck 未通过。
- 设计 CI-in-the-loop 或 check agent 的退出条件。
- 需要在 [test-driven-development](../test-driven-development/SKILL.md) 之后加一层自动化验证门禁。

## 核心约束

- 必须有**安全上限**（max iterations），防止无限循环。建议默认 5 次。
- 循环退出条件必须**可程序化验证**（命令返回码、marker 文本），不能靠 agent 自我声称。
- 每轮迭代必须**只改一个变量**：修一个问题、跑一次验证，不要批量修然后祈祷。
- 验证命令的**超时**要合理设置（建议单命令 2 分钟上限）。
- 达到 max iterations 时必须**优雅退出**，报告当前状态和未解决项。

## 实施步骤

### 步骤 1：定义验证命令清单

列出必须全部通过才能退出的验证命令：

```yaml
# 示例验证清单
verify:
  - npm run lint          # 零 error
  - npm run typecheck     # 零 error
  - npm test              # 全绿
  - npm run build         # 构建成功
```

**原则**：只放阻塞性检查（必须通过的），warning 级别的不放进循环条件。

### 步骤 2：选择验证模式

| 模式 | 适用场景 | 退出条件 |
|---|---|---|
| **命令验证** | 有明确的 CLI 检查命令 | 所有命令返回 exit 0 |
| **Marker 验证** | 无 CLI 但有文本输出 | agent 输出中包含所有 `{CHECK}_FINISH` marker |
| **混合模式** | 部分可自动化、部分需人工 | 自动检查通过 + 人工确认 |

**命令验证优先**——能用命令返回码判断的，不要用 marker。

### 步骤 3：执行验证循环

```text
iteration = 0
max_iterations = 5

LOOP:
  iteration += 1

  if iteration > max_iterations:
    REPORT "达到最大迭代次数，以下检查仍未通过：{failing_checks}"
    EXIT with concerns

  run all verify commands

  if all pass:
    REPORT "所有检查通过"
    EXIT success

  for each failed check:
    READ error output
    DIAGNOSE root cause (hypothesis-driven, not guess-and-check)
    APPLY minimal fix

  GOTO LOOP
```

### 步骤 4：结果报告

每次循环结束（无论成功或超限）都要输出：

```markdown
## 验证结果

| 检查项 | 状态 | 备注 |
|--------|------|------|
| lint   | ✅   |      |
| typecheck | ✅ |      |
| test   | ❌   | 2 failing: test_auth, test_cache |
| build  | ⏭️   | 未执行（前置检查未通过） |

**迭代次数**: 3/5
**最终状态**: ⚠️ DONE_WITH_CONCERNS
**未解决项**: test_auth 依赖外部服务 mock 缺失
```

## 代码模式

详见 [references/patterns.md](./references/patterns.md)，包含 3 组 FAIL/PASS 对比：
- 自我声称 vs 命令验证
- 批量修复 vs 逐项修复
- 无限循环 vs 优雅退出

## 检查清单

- [ ] 验证命令清单是否明确定义，且每条都是阻塞性检查
- [ ] 是否设置了 max iterations 安全上限（建议 ≤ 5）
- [ ] 是否每条命令都有超时设置（建议 ≤ 2 分钟）
- [ ] 退出条件是否基于程序化验证（exit code / marker），而非 agent 自我声称
- [ ] 超限退出时是否报告了未解决项和建议
- [ ] 是否避免了批量修复（一次只改一个问题）

## 反模式

- **信任 agent 的"已修复"声明而不跑验证**：agent 可能遗漏、误判或幻觉。
- **把 warning 放进循环条件**：导致循环在非关键问题上空转。
- **没有 max iterations**：agent 卡在无解问题上无限重试。
- **用 marker 替代命令验证**：agent 可能输出 marker 但实际检查没跑或没通过。
