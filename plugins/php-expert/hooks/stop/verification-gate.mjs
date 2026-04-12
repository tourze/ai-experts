/**
 * verification-gate (Stop) — 完成声明必须附带验证证据
 * php-expert 插件提取的 PHP 专用版本。
 *
 * 当 Claude 在本轮结束时宣称"已完成 / 修复了 / all tests pass / looks good"
 * 等完成语,必须同时在本轮 turn 内执行过测试 / 构建 / lint 之一。
 * 否则阻断 Stop,强制 Claude 先跑验证再声明。
 *
 * 依据:全局 CLAUDE.md 的"禁止先写后补证据"硬规则,原由
 *       skills/verification-before-completion 承担,但 skill 完全依赖
 *       Claude 自觉调用;hook 把该纪律从"靠自觉"升级为"机械强制"。
 *
 * 实现要点(经过一次重写):
 *
 * [1] 完全基于 `transcript_path` 读取 JSONL,不依赖任何非文档字段。
 *     - 早期版本用了 payload.last_assistant_message,但那个字段只在
 *       SubagentStop payload 里出现,Stop hook 没有(见官方文档)
 *     - 现有 desktop-notification.mjs 也误用了它,只是靠 || 兜底
 *
 * [2] hook 是 one-shot 子进程,不保进程内存,所有"上下文"都从磁盘上的
 *     transcript 文件重新解析。这是 Claude Code 为 hook 提供的标准机制。
 *
 * [3] ⚠ 不可回避的假设:**当 Stop hook 触发时,当前 turn 的 assistant
 *     记录已经 flush 到 transcript**。官方文档没明确承诺这个时序,
 *     但有两层保险:
 *       - 经验证据:本项目真实 transcript 里 assistant 消息永远先于
 *         同轮 stop_hook_summary 出现(JSONL 流式 append)
 *       - final-message 启发式(见 [5]):只有当最后一条 assistant
 *         记录是"纯文本、无 tool_use"时才认定为"本轮终发言",
 *         避免把半截流水日志当终点
 *
 * [4] 按 `promptId` 隔离当前 turn,过滤 `isSidechain === true` 避免
 *     把 subagent(Explore/Plan 等)的行为算到主线头上。
 *
 * [5] final-message 启发式:
 *       - 最后一条 assistant 记录 = 有 text 且无 tool_use → 认定为终发言
 *       - 最后一条 assistant 记录还有 tool_use → Claude 可能还在跑工具,
 *         或 transcript 尚未完全 flush → return null 放行
 *     这个启发式保证:只要检测到完成声明,就一定是"最终 assistant 输出",
 *     而不是中途的过渡语。
 *
 * [6] 所有不确定路径上都 fail-open(return null):宁可漏判不可误伤 Stop。
 *     最坏情况是 gate 没触发,不会出现"错误阻断完成"。
 *
 * 门控条件(全部满足才阻断):
 *   1. 不是 stop_hook_active 再次触发(防死循环)
 *   2. transcript 可读
 *   3. 当前 turn 可识别(promptId 找得到)
 *   4. 当前 turn 有 Edit/Write/NotebookEdit 改动(纯答疑不 gate)
 *   5. 当前 turn 最后一条 assistant 记录是"纯文本终发言"
 *   6. 该终发言命中完成声明正则
 *   7. 当前 turn 没有匹配到任何验证命令
 */

import { existsSync, readFileSync } from "fs";

// ── 完成声明正则(中英双语) ─────────────────────────
// 词表保持保守:宁可漏判也不误伤普通对话。
const COMPLETION_CLAIMS = [
  // 中文 — 完成
  /已完成|已修复|已搞定|已解决/,
  /(?:问题|bug|测试|验证)(?:都)?(?:通过|解决|修复|搞定)了/,
  /都已经?(?:通过|完成|修复|解决)了/,
  /(?:现在|应该)(?:可以|能|没问题|OK)/,
  /修改完(?:毕|成)/,
  /(?:功能|改动|重构)完成/,
  /修好了|改完了|写完了|弄好了/,
  // 英文 — 完成
  /\ball (?:tests?|checks?|lints?|builds?) (?:are )?pass(?:ing|ed)?\b/i,
  /\btests? pass(?:es|ed|ing)?\b/i,
  /\bbuild (?:is )?(?:green|passing|successful)\b/i,
  /\b(?:bug|issue|problem) (?:is )?fixed\b/i,
  /\bshould (?:work|pass|be fine)\b/i,
  /\blooks? (?:correct|good|right|fine)\b/i,
  /\bready to (?:commit|land|merge|ship|push)\b/i,
  /\bdone,? (?:all|the) /i,
  /\bwe're done\b/i,
  /\ball (?:good|set|clear|done)\b/i,
];

// ── 验证命令正则（仅 PHP 相关） ─────────────────────
const VERIFICATION_COMMANDS = [
  /\bphpunit\b/,
  /\bphpstan\b/,
  /\bvendor\/bin\/(?:phpunit|phpstan|pest|psalm)\b/,
  /\bpest\b/,
];

function parseTranscript(path) {
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    return null;
  }
  const records = [];
  for (const line of content.split("\n")) {
    if (!line) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      // 损坏行跳过,继续
    }
  }
  return records;
}

/**
 * 从 transcript 逆向找到"最近一次真实用户输入"所在的 promptId。
 * tool_result 也是 type=user 但 content 里有 tool_use_id,要跳过。
 * sidechain 记录直接忽略。
 */
function findCurrentPromptId(records) {
  for (let i = records.length - 1; i >= 0; i--) {
    const rec = records[i];
    if (rec.isSidechain === true) continue;
    if (rec.type !== "user" || !rec.promptId) continue;
    const content = rec.message?.content;
    if (typeof content === "string") return rec.promptId;
    if (Array.isArray(content)) {
      const isToolResult = content.some((c) => c && c.tool_use_id);
      if (!isToolResult) return rec.promptId;
    }
  }
  return null;
}

/**
 * 判断一个 assistant 记录是不是"纯文本终发言":
 *   有至少一个 text 项,且没有任何 tool_use 项。
 * 这是 final-message 启发式的核心判据——详见文件头 [5]。
 */
function isTextOnlyAssistant(rec) {
  const items = rec?.message?.content;
  if (!Array.isArray(items)) return false;
  let hasText = false;
  for (const item of items) {
    if (!item) continue;
    if (item.type === "tool_use") return false;
    if (item.type === "text" && typeof item.text === "string" && item.text.length > 0) {
      hasText = true;
    }
  }
  return hasText;
}

/**
 * 扫描当前 turn(同 promptId)的所有主线 assistant 记录,收集:
 *   - hadCodeChange:是否出现过 Edit/Write/NotebookEdit
 *   - hadVerification：是否出现过匹配 VERIFICATION_COMMANDS 的 Bash
 *   - finalText：**最后一条 assistant 记录**若为"纯文本终发言"则返回其文本,
 *               否则为空字符串(表示无法确信拿到了终发言)
 */
function collectTurnInfo(records, promptId) {
  const info = {
    hadCodeChange: false,
    hadVerification: false,
    finalText: "",
  };

  let lastAssistantRecord = null;

  for (const rec of records) {
    if (rec.promptId !== promptId) continue;
    if (rec.isSidechain === true) continue;
    if (rec.type !== "assistant") continue;

    lastAssistantRecord = rec;

    const items = rec.message?.content;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || item.type !== "tool_use") continue;

      if (item.name === "Edit" || item.name === "Write" || item.name === "NotebookEdit") {
        info.hadCodeChange = true;
        continue;
      }

      if (item.name === "Bash") {
        const cmd = item.input?.command;
        if (typeof cmd === "string" && VERIFICATION_COMMANDS.some((re) => re.test(cmd))) {
          info.hadVerification = true;
        }
      }
    }
  }

  // final-message 启发式:
  //   只有当最后一条 assistant 记录是纯文本(无 tool_use)时,
  //   才认为本轮已经跑到终发言,否则留空让上层 fail-open 放行。
  if (lastAssistantRecord && isTextOnlyAssistant(lastAssistantRecord)) {
    const items = lastAssistantRecord.message.content;
    info.finalText = items
      .filter((i) => i && i.type === "text" && typeof i.text === "string")
      .map((i) => i.text)
      .join("\n");
  }

  return info;
}

function findClaim(text) {
  for (const re of COMPLETION_CLAIMS) {
    const m = text.match(re);
    if (m) {
      const idx = m.index ?? 0;
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + m[0].length + 20);
      return text.slice(start, end).replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

export async function run(payload) {
  // 1. 防死循环:已经被阻断过一次,本次 Stop 放行
  if (payload?.stop_hook_active) return null;

  // 2. 必须有可读的 transcript
  const transcriptPath = payload?.transcript_path;
  if (!transcriptPath || !existsSync(transcriptPath)) return null;

  const records = parseTranscript(transcriptPath);
  if (!records || records.length === 0) return null;

  // 3. 定位当前 turn
  const promptId = findCurrentPromptId(records);
  if (!promptId) return null;

  // 4. 统计 turn 信息
  const info = collectTurnInfo(records, promptId);

  // 5. 纯答疑(无代码改动) → 不 gate
  if (!info.hadCodeChange) return null;

  // 6. 拿不到"纯文本终发言" → transcript 可能还没 flush,fail-open 放行
  if (!info.finalText.trim()) return null;

  // 7. 没命中完成声明 → 不 gate
  const claimSnippet = findClaim(info.finalText);
  if (!claimSnippet) return null;

  // 8. 有改动 + 完成声明 + 有验证 → 放行
  if (info.hadVerification) return null;

  // 9. 有改动 + 完成声明 + 无验证 → block
  return {
    decision: "block",
    reason: [
      "[Verification Gate] 检测到完成声明,但本轮未见任何验证命令",
      "",
      `  声明片段:…${claimSnippet}…`,
      `  本轮改动:Edit/Write/NotebookEdit 已发生`,
      `  验证命令:未检测到(test / build / lint 之一)`,
      "",
      "请先执行相关验证后再声明完成,例如:",
      "  - 测试: phpunit / vendor/bin/pest ...",
      "  - 静态分析: phpstan / vendor/bin/psalm ...",
      "",
      "若本轮确实无需验证(例如仅改文档 / 配置注释),请明确说明\"无需验证因为 X\"即可放行。",
    ].join("\n"),
  };
}
