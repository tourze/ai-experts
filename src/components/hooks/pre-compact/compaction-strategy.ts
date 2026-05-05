import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const compactionStrategyHook = defineHook({
  id: "compaction-strategy",
  description: "在上下文压缩前注入信息保留优先级策略。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreCompact,
  entry: new URL("./compaction-strategy.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * compaction-strategy (PreCompact) — 注入压缩保留策略
 *
 * 行为:
 *   在上下文压缩发生前，向 Claude 注入「哪些信息必须保留、哪些可以丢弃」
 *   的优先级指引，防止压缩过程丢失关键决策、任务状态和架构约定。
 *
 * 为什么要这么做:
 *   Claude Code 的上下文压缩是自动的，默认按时间和相关性裁剪。但某些信息
 *   对当前任务至关重要（如用户的核心决策、已建立的约定、活跃的错误上下文），
 *   如果被裁掉会导致 Claude 重复提问或做出与先前决策矛盾的行为。
 *
 * 失败策略:
 *   - 任何异常 → return null（fail-open）
 *   - 本 hook 纯文本注入，无 I/O，几乎不可能失败
 */

const STRATEGY = `[Compaction Preservation Strategy] 压缩保留策略

本段由 PreCompact hook 注入，指导上下文压缩时的信息保留优先级。

── 必须保留（丢失 = 行为退化） ──

1. 用户的核心决策和约定
   - 用户明确说过「要 / 不要」「用 X 不用 Y」的指令
   - 已确认的技术选型、架构方向、命名约定
   - 用户对方案的批准或否决

2. 当前任务状态
   - 正在执行的计划和已完成的步骤
   - 活跃的错误/阻塞及其调查进展
   - 待确认的变更清单

3. 项目关键约束
   - 记忆文件中的架构约束和工作流规则
   - 已发现的项目特定约定（命名、分层、错误处理风格）
   - 依赖关系和影响半径分析结果

4. 安全与合规上下文
   - 涉及的安全敏感操作和已获授权
   - 环境变量、凭据相关的讨论（保留决策，不保留值）

── 优先丢弃（保留价值低） ──

- 大段工具输出的原文（grep 结果、git log、文件内容）→ 保留结论即可
- 已完成且无后续影响的中间调查步骤
- 重复的确认对话（「好的」「明白」）
- 已被后续决策覆盖的早期方案讨论

── 压缩后自检 ──

压缩完成后，如果对以下问题答不上来，说明压缩过度：
- 用户要我做什么？（任务目标）
- 我现在做到哪了？（进度）
- 有什么约束？（项目规则 + 用户偏好）
- 下一步是什么？（行动计划）`;

export async function run(_payload) {
  return {
    decision: "context",
    reason: STRATEGY,
  };
}
