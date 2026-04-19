# 反模式与正例

## FAIL: 用 TodoWrite 做持久化

```
用户："帮我重构认证模块"
→ 调 TodoWrite 写 8 条 todo → 做到第 3 条用户 /clear
→ 新会话里 todo 列表消失，只能重新问"我们上次做到哪了"
```

## PASS: 四文件落盘

```
→ 新建 context.md（意图锚点）+ task_plan.md（5 阶段）+ findings.md + progress.md
→ /clear 后新会话读 context.md 恢复意图 → 读 progress.md 尾部 → 立即知道 phase 3 进行中
```

## FAIL: 跳过 context snapshot 直接写计划

```
用户："优化首页加载速度"
→ 直接写 task_plan.md："1. 压缩图片 2. 懒加载 3. CDN"
→ 做到一半发现用户的真正意图是"减少 TTFB"，图片优化完全偏了
→ 计划推翻重做，前面的工作浪费
```

## PASS: Context snapshot 先锚定意图

```
→ 先创建 context.md，Intent Hypothesis 写"用户可能关注 TTFB 而非资源体积"
→ Unknown 里写"需确认：瓶颈是服务端还是客户端"
→ Phase 1 Discovery 先跑 Lighthouse → 发现 TTFB 是主要问题
→ 计划从一开始就对准方向
```

## FAIL: 把外部内容灌进 task_plan.md

```
web_fetch 了一篇 10KB 博客 → 贴进 task_plan.md 的 "References" 节
→ 每次 PreToolUse 刷计划时都把博客塞进 context → 污染注意力窗口
```

## PASS: 外部内容隔离到 findings.md

```
task_plan.md 只记一行："见 findings.md#auth-lib-comparison"
findings.md 才存博客摘要 + URL → 计划文件保持精简，刷新成本可控
```

## FAIL: 自称完成但没有验证证据

```
→ 写完代码 → progress.md 记 "task complete"
→ 没跑测试、没跑构建、没对照 context.md 的 Desired Outcome
→ 实际上有 3 个测试失败，用户发现后信任度下降
```

## PASS: 完成门控 + 工具验证

```
→ 跑 npm test → 全部通过（截图/输出存 findings.md）
→ 检查 task_plan.md → 无 pending/in_progress 项
→ 对照 context.md Desired Outcome → 实际产出匹配
→ progress.md 追加 "[timestamp] task complete — verified by test suite"
```

## FAIL: 错误无限重试

```
npm test 失败 → 再跑一次 → 还是失败 → 再跑一次（第 5 次）
→ 没记错误、没换方法、没更新计划
```

## PASS: 三次规则 + 错误日志

```
Attempt 1: 读错误信息 → 定位到 jest config → 修 moduleNameMapper
Attempt 2: 还失败 → 换策略：先隔离单测
Attempt 3: 还失败 → 质疑 "jest 是否适合这个场景" → 更新计划改用 vitest
→ 每次都在 task_plan.md 的 Errors 表追加一行
```
