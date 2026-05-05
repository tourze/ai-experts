# 验证循环

## 适用场景

- 需要让 agent 在"实现→验证→修复→再验证"的循环中工作，直到所有检查通过。
- 防止 agent 过早声称"已完成"但实际 lint/test/typecheck 未通过。
- 设计 CI-in-the-loop 或 check agent 的退出条件。
- 需要在 test-driven-development 之后加一层自动化验证门禁。

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
| lint   | PASS |      |
| typecheck | PASS |      |
| test   | FAIL | 2 failing: test_auth, test_cache |
| build  | SKIP | 未执行（前置检查未通过） |

**迭代次数**: 3/5
**最终状态**: DONE_WITH_CONCERNS
**未解决项**: test_auth 依赖外部服务 mock 缺失
```

## 代码模式

### FAIL: Agent 自我声称完成

```text
Agent: "我已经修好了所有 lint 错误。DONE"
实际: 还有 3 个 TypeScript 编译错误
→ 没有运行验证命令，靠"感觉"判断完成
```

### PASS: 命令验证才信任

```bash
# 每轮都实际运行
npm run lint 2>&1 | tail -5
echo "EXIT CODE: $?"

# 只有 exit 0 才算通过
if [ $? -eq 0 ]; then
  echo "LINT_FINISH"
fi
```

### FAIL: 批量修复后一次验证

```text
一次性改了 lint + types + tests 的 15 个文件
运行验证 → 5 个新错误
→ 不知道哪个修复引入了新问题
```

### PASS: 每修一个问题就验证

```text
Round 1: lint error in auth.ts:23 → fix → run lint → still 2 errors
Round 2: lint error in cache.ts:45 → fix → run lint → still 1 error
Round 3: lint error in index.ts:12 → fix → run lint → 0 errors → LINT_FINISH
→ 每步可追溯
```

### FAIL: 无限循环无安全阀

```text
循环第 12 轮...还在修...
→ 可能是系统性问题，不是单个 fix 能解决的
→ agent 卡死，用户等到天荒地老
```

### PASS: 有上限的优雅退出

```text
Round 5/5: typecheck 仍有 2 个 error
→ 报告："达到最大迭代次数。以下问题可能需要架构调整而非局部修复：
   - TS2322: Type 'string' is not assignable to 'number' (涉及跨模块类型)
   建议：人工审查 types/shared.d.ts 的接口定义"
→ EXIT with DONE_WITH_CONCERNS
```

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
