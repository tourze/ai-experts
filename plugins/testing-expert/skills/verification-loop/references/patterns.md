# 验证循环 — 代码模式

## FAIL: Agent 自我声称完成

```text
Agent: "我已经修好了所有 lint 错误。✅ DONE"
实际: 还有 3 个 TypeScript 编译错误
→ 没有运行验证命令，靠"感觉"判断完成
```

## PASS: 命令验证才信任

```bash
# 每轮都实际运行
npm run lint 2>&1 | tail -5
echo "EXIT CODE: $?"

# 只有 exit 0 才算通过
if [ $? -eq 0 ]; then
  echo "LINT_FINISH"
fi
```

## FAIL: 批量修复后一次验证

```text
一次性改了 lint + types + tests 的 15 个文件
运行验证 → 5 个新错误
→ 不知道哪个修复引入了新问题
```

## PASS: 每修一个问题就验证

```text
Round 1: lint error in auth.ts:23 → fix → run lint → still 2 errors
Round 2: lint error in cache.ts:45 → fix → run lint → still 1 error
Round 3: lint error in index.ts:12 → fix → run lint → 0 errors → LINT_FINISH
→ 每步可追溯
```

## FAIL: 无限循环无安全阀

```text
循环第 12 轮...还在修...
→ 可能是系统性问题，不是单个 fix 能解决的
→ agent 卡死，用户等到天荒地老
```

## PASS: 有上限的优雅退出

```text
Round 5/5: typecheck 仍有 2 个 error
→ 报告："达到最大迭代次数。以下问题可能需要架构调整而非局部修复：
   - TS2322: Type 'string' is not assignable to 'number' (涉及跨模块类型)
   建议：人工审查 types/shared.d.ts 的接口定义"
→ EXIT with ⚠️ DONE_WITH_CONCERNS
```
