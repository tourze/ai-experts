/**
 * debug-methodology-primer (UserPromptSubmit) — 检测 bug 调查意图并注入
 * 「假设驱动调查 + 根因追溯」两套互补的调试方法论
 *
 * 行为:
 *   当用户消息中出现明确的错误现象(crash / 报错 / 挂了 / timeout / 5xx)、
 *   调查动作(debug / 排查 / reproduce / root cause / 为什么会…)、或间歇性
 *   现象(flaky / 偶发 / 诡异 / regression)时,本 hook 向 Claude 注入一段
 *   additionalContext,内容合并了原 skills/debug-investigator(假设驱动 5 步)
 *   与原 skills/root-cause-finder(症状/根因分离 + canonical source +
 *   hidden writes 审计)的核心原则,让 Claude 在动手改代码前先走方法论。
 *
 * 为什么要这么做:
 *   原两个 skill 都被标注为 "Use when bug…",但这是写给 LLM 的自律,实际
 *   大量调试场景 Claude 拿到 prompt 就开始 "让我试试改这里 → 没好 → 再试",
 *   完全不走假设驱动。参照 investigation-primer / feedback-detector 的
 *   模式:把触发时机从 "LLM 自觉" 改成 "UserPromptSubmit 机械匹配",
 *   方法论原样注入 prompt,强制在改代码前思考。
 *
 *   与 investigation-primer 的关系:两者是正交维度,可同时注入。
 *     • investigation-primer 讲 "编码前摸清项目家底"(定位/依赖/测试/风格)
 *     • 本 hook 讲 "bug 怎么查"(假设 + 根因 + hidden writes)
 *   dispatch.mjs 会把两段 context 用 \n\n 合并成一次 additionalContext。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不替代 CLAUDE.md 或原 skill 文件,而是把触发时机机械化
 *   - 不对所有 "修复" 类 prompt 触发 —— 只对明确的 bug 调查场景触发。
 *     "修一下命名"、"修改注释"、"修复格式" 这类非运行时错误的 "修",
 *     不触发本 hook(investigation-primer 会覆盖它们)
 *   - 不做任何本仓库特定的维护动作
 *   - 不在 hook 内部自动读日志 / 跑调试器 —— hook 拿不到项目根,也不应阻塞
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫,避免对 skill 调用误触
 *   - 未命中任一调试信号
 */

// ── 调试信号:正则 + 类型分类 ──
//
// 设计取舍:
//   - 触发条件必须比 investigation-primer 的 fix 集合更窄。investigation-primer
//     会对 "修一?下 / 修复 / 修改" 这类通用动词触发,但调试方法论只针对
//     "有一个运行时错误或异常行为需要追根因" 的场景。所以本 hook 只在出现
//     明确的错误名词(bug/crash/error)、调试动词(debug/排查/为什么会)、
//     或间歇性形容词(flaky/偶发)时触发。
//   - 宁可多触发,不可漏触发 —— 本 hook 只注入 context,false positive 的
//     代价仅为多读一段文字。
//   - 英文动词全部加 \b 词边界。中文没有词边界,靠常见搭配限定。
//
// kind:
//   error       明确的错误现象(有一个可观察的故障)
//   investigate 明确的调查动作(用户在请求 debug / 找根因)
//   flaky       间歇性 / 诡异 / 回归现象(非确定性 bug)
const DEBUG_SIGNALS = [
  // === 中文 — 错误现象 ===
  { re: /bug|报错|异常|崩溃|死锁|panic|段错误|内存泄(?:露|漏)|栈溢出/i, kind: "error" },
  { re: /挂了|挂掉|不工作|不生效|失效|跑不起来|打不开|启动不了|起不来|无响应/, kind: "error" },
  { re: /超时|卡住|卡死|卡在|hang(?:\s*住)?/i, kind: "error" },
  { re: /闪退|直接退出|被杀|OOM|out\s*of\s*memory/i, kind: "error" },
  { re: /连不上|连接失败|请求失败|返回\s*[45]\d\d|5\d\d\s*错误/, kind: "error" },
  // === 中文 — 调查动作 ===
  { re: /调试一?下|调试代码|排查一?下|排查并|定位问题|找一?下原因|找根因|追踪一?下/, kind: "investigate" },
  { re: /复现一?下|重现一?下|想复现|无法复现/, kind: "investigate" },
  { re: /为什么(?:会|不|没|报|出|挂|死|这样|这么|总是|一直)/, kind: "investigate" },
  { re: /根(?:本)?原因|根因分析/, kind: "investigate" },
  // === 中文 — 间歇/诡异/回归 ===
  { re: /间歇(?:性|地)?|偶发|偶尔|有时候(?:会|才)|时不时|诡异|莫名/, kind: "flaky" },
  { re: /(?:线上|生产|prod)(?:出事|故障|告警|挂了|异常|报错)/i, kind: "flaky" },
  { re: /之前(?:能|可以|好好的)|以前(?:能|可以|好好的)|昨天还(?:能|好好的)/, kind: "flaky" },
  // === 英文 — 错误现象 ===
  { re: /\b(?:crash(?:ing|es|ed)?|panic(?:s|ked|king)?|segfault|segv|assertion|deadlock|oom)\b/i, kind: "error" },
  { re: /\b(?:error|exception|failure|broken|not\s+working|doesn'?t\s+work|stopped\s+working|stack\s*overflow)\b/i, kind: "error" },
  { re: /\bstack\s*trace|traceback\b/i, kind: "error" },
  { re: /\b(?:timeouts?|time[sd]\s*out|hang(?:ing|s|ed)?|stuck|unresponsive|frozen)\b/i, kind: "error" },
  { re: /\b(?:5\d\d\s*(?:error|status|response)?|internal\s+server\s+error|bad\s+gateway)\b/i, kind: "error" },
  // === 英文 — 调查动作 ===
  { re: /\b(?:debug|troubleshoot|investigate|diagnose|bisect)\b/i, kind: "investigate" },
  { re: /\b(?:reproduce|repro|min(?:imal)?\s+repro)\b/i, kind: "investigate" },
  { re: /\broot\s*cause(?:\s+analysis)?\b/i, kind: "investigate" },
  { re: /\bwhy\s+(?:does|is|did|are|doesn'?t|isn'?t|can'?t)\b/i, kind: "investigate" },
  // === 英文 — 间歇/诡异/回归 ===
  { re: /\b(?:intermittent|flaky|sporadic|non[-\s]?deterministic|heisenbug|race\s+condition)\b/i, kind: "flaky" },
  { re: /\b(?:regression|used\s+to\s+work|worked\s+before|was\s+working)\b/i, kind: "flaky" },
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt) {
  const hits = [];
  for (const { re, kind } of DEBUG_SIGNALS) {
    const match = prompt.match(re);
    if (match) {
      hits.push({ kind, snippet: match[0].trim() });
    }
  }
  return hits;
}

export async function run(payload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;

  // 斜杠命令(slash command)不扫,避免对 /debug-investigator 之类调用误触
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  // 按 kind 去重 + 聚合命中片段(最多展示 5 条,避免注入过长)
  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels = {
    error: "错误现象",
    investigate: "调查动作",
    flaky: "间歇/回归/诡异现象",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Debug Methodology Primer] 调试方法论 触发",
      "",
      "检测到当前 prompt 属于 bug 调查 / 故障排查类任务。在改代码前,必须",
      "先按下面两套互补的方法论思考。(本段等价于原 skills/debug-investigator",
      "与 skills/root-cause-finder 的核心原则,已脱离本仓库上下文,适用于",
      "任何工程场景。)",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── 第一维:假设驱动调查 (Hypothesis-Driven Investigation) ──",
      "",
      "0. 禁止先改代码 —— 「让我先试试改这里」不是调试,是瞎猜。每一次",
      "   改动前必须有明确的假设、验证步骤、预期结果。",
      "",
      "1. 症状捕获 —— 用精确语言,禁止「挂了 / 不行 / 有 bug」类模糊词",
      "   观察到什么 / 期望是什么 / 可复现性(总是 / 间歇 / 一次性) /",
      "   第一次出现的时间 / 环境信息(版本、配置、差异)。",
      "",
      "2. 证据收集 —— 先看日志和 trace,再做假设",
      "   • stacktrace 读底朝上:最后一帧是现场,上几帧才是原因",
      "   • 日志时序异常、重复错误、状态机未完成、外部事件相关性",
      "   • 近期 git diff:尤其覆盖错误路径的文件",
      "",
      "3. 假设生成 —— 列 3-5 条 ranked hypotheses,而不是只盯一条",
      "   每条必须有:具体声明 + 支持证据 + 验证方法 + 反证方法。",
      "   排序依据:简单假设优先(错别字 > 竞态)、近期变更优先、",
      "   能解释所有症状的优先。",
      "",
      "4. 单变量验证 —— 一次只动一个变量",
      "   • 先测 H1,有结果再决定下一步",
      "   • 本地不能复现 → 对比环境差异,先投资复现环境,再修",
      "   • bug 在某次提交后才出现 → git bisect 二分",
      "",
      "5. 死胡同也要记 —— 失败假设是成果,能避免后续重走老路",
      "",
      "── 第二维:根因追溯 (Root-Cause-First) ──",
      "",
      "A. 症状 / 触发 / 根因 / 最小修复 / 架构改进 —— 这 5 个必须拆开写,",
      "   不要混成一句话。想不清楚就不写代码。",
      "",
      "B. 灵魂拷问:这个请求 / 写入 / 副作用本应发生吗?",
      "   很多 bug 是「不该发生的调用发生了」,不是「调用了但参数不对」。",
      "   答案若是「本来就不该发生」,就去堵源头,不要在下游放宽校验。",
      "",
      "C. 找到「第一个意外副作用」—— 从你观察到的错误反向追,到最早一次",
      "   偏离期望的系统行为。报错常常只是最终结果,真正的 bug 是某个看似",
      "   无害的读 / 写 / mutation 发生在了不该发生的位置。",
      "",
      "D. Canonical source of truth vs competing sources ——",
      "   这个状态谁拥有?有几个地方在写它?多源之争是「没人改但值变了」",
      "   类 bug 的头号原因(lifecycle 启动、observer、后台任务、缓存恢复)。",
      "",
      "E. Hidden writes 审计 —— 默认可疑,直到证明合法:",
      "   lifecycle hook、observer / watcher、middleware / interceptor、",
      "   重试逻辑、后台任务 / 定时器、持久化恢复、启动脚本。",
      "   只有显式 handler / 用户操作默认合法,其余写入都要证明其意图。",
      "",
      "F. 禁止修错层 —— 不要为了让症状消失就加 null check、放宽 schema、",
      "   try-catch 吞异常。优先修上游:让「不该发生的调用」根本不发生。",
      "   只有证明「上游修了还不够」时,才在下游加防御。",
      "",
      "── 工作纪律 ──",
      "",
      "  • 没有假设不写代码:猜测 ≠ 调试",
      "  • 一次只动一个变量:同时改两处,无法归因",
      "  • 复现优先于修复:不稳定复现 → 先投资复现环境",
      "  • 根因先于补丁:症状消失 ≠ bug 修好",
      "  • 死胡同要记录:被推翻的假设能收窄搜索空间",
      "",
      "── 何时可以简化或跳过 ──",
      "",
      "  • 错误消息已包含答案(「module X not found」直接装):跳过 1-3",
      "  • 已知环境问题(版本不符 / 配置缺失):按配置问题处理,不展开调查",
      "  • 第三方服务故障:提 support ticket,不调其代码",
      "  • 生成代码 / minified 代码:调试源码,不调产物",
      "",
      "依据:原 skills/debug-investigator 的 Hypothesis → Evidence → Test",
      "      循环 + skills/root-cause-finder 的 Symptom/Trigger/Root cause",
      "      分离与 canonical source / hidden writes 审计原则,已由本 hook",
      "      合并注入。原 skill 文件可继续存在,本 hook 只负责机械触发时机。",
    ].join("\n"),
  };
}
