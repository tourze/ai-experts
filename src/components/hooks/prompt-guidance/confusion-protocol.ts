import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

export const confusionProtocolHook = defineHook({
  id: "confusion-protocol",
  description: "检测高歧义决策信号并注入命名歧义、呈现选项、问用户协议。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./confusion-protocol.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * confusion-protocol (UserPromptSubmit) — 检测高歧义编码场景并注入
 * 「命名歧义 → 呈现选项 → 问用户」的强制停下协议
 *
 * 行为:
 *   当用户消息中出现架构二选一（「A 还是 B」「用 X 还是 Y」）、破坏性操作的
 *   模糊范围（「删掉旧的」「清理一下」但没指定具体对象）、矛盾信号（同时
 *   提到两个不兼容方向）、或缺失关键上下文（「帮我改改」「优化一下」但没说
 *   改什么优化什么）时,本 hook 向 Claude 注入一段 additionalContext,
 *   要求在**高歧义决策点**强制停下来,命名歧义,呈现选项,问用户。
 *
 * 为什么要这么做:
 *   Claude 在面对模糊指令时倾向于「先做再说」—— 挑一个看起来合理的方向
 *   直接动手。这在低风险场景(改注释、调格式)可接受,但在高风险场景
 *   (架构选择、数据模型、破坏性操作)代价很高:做完才发现方向错了,
 *   回退成本远大于先问一句。
 *
 *   与 investigation-primer 的关系:正交。investigation 管「动手前摸清家底」,
 *   本 hook 管「摸清家底后发现有歧义,在做决定前先问」。前者是信息收集,
 *   后者是决策确认。
 *
 *   与 over-engineering-primer 的关系:正交。over-engineering 管「不做多余的事」,
 *   本 hook 管「该做的事方向不确定时先问」。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不要求所有任务都先问 —— 只在高歧义、高风险场景触发
 *   - 不替代用户给出清晰指令的责任 —— 只是在指令不清时提醒先确认
 *   - 不做任何本仓库特定的维护动作
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫
 *   - 未命中任一歧义信号
 *   - 用户明确表示「放手干 / 你决定 / 随便选」—— 已授权自主决策
 */

// ── 歧义信号:正则 + 类型分类 ──
//
// kind:
//   ambiguous_choice   用户在两个以上方案间犹豫,没给出明确选择
//   vague_scope        破坏性或大范围操作但范围模糊
//   contradictory      同一 prompt 中出现矛盾方向
//   missing_context    明确的编码动作但缺失关键信息
//
// 设计取舍:
//   - 触发条件要比 investigation-primer 窄 —— 只针对「有决策歧义」的场景。
//     如果用户目标明确("修复 parseJSON 的空指针"),不触发。
//   - 宁可多触发 —— 代价仅为注入一段提醒文字,Claude 判断无歧义可自行跳过。
//   - 英文词全部加 \b 边界;中文无词边界,靠常见搭配限定。
const AMBIGUITY_SIGNALS = [
  // === 中文 — 方案选择歧义 ===
  { re: /(?:用|选|采用|改成)\s*.+?\s*(?:还是|或者|或|vs)\s*.+/i, kind: "ambiguous_choice" },
  { re: /(?:A|B)\s*(?:方案|方式|做法)|方案\s*(?:一|二|1|2)/, kind: "ambiguous_choice" },
  { re: /(?:你觉得|你看|怎么选|哪个好|哪种好|应该选|建议用)/, kind: "ambiguous_choice" },
  { re: /(?:有几种|有两种|有多种)(?:方案|做法|实现|思路|选择)/, kind: "ambiguous_choice" },
  { re: /不确定(?:该|应该|要|是)/, kind: "ambiguous_choice" },

  // === 中文 — 模糊范围 ===
  { re: /(?:删掉|去掉|清理|清除|移除)(?:旧的|老的|不用的|没用的|多余的)/, kind: "vague_scope" },
  { re: /(?:重构|重写|改造|整理)(?:一下|一番|这(?:块|部分|个)|这些)/, kind: "vague_scope" },
  { re: /(?:优化|改进|提升)(?:一下|一番|这(?:块|部分|个))/, kind: "vague_scope" },

  // === 中文 — 矛盾方向 ===
  { re: /(?:既要|一方面).+?(?:又要|另一方面|但又|同时又)/, kind: "contradictory" },
  { re: /(?:简单|简洁).+?(?:但|不过|同时).+?(?:完整|全面|健壮)/, kind: "contradictory" },

  // === 中文 — 缺失上下文 ===
  { re: /(?:帮我|请你|麻烦)(?:改改|改一下|调调|调一下|看看|处理一下)$/, kind: "missing_context" },
  { re: /(?:这个|这块|这里)(?:有点|不太)(?:问题|对|好)/, kind: "missing_context" },

  // === 英文 — 方案选择歧义 ===
  { re: /\bshould\s+(?:I|we)\s+(?:use|go\s+with|pick|choose)\b/i, kind: "ambiguous_choice" },
  { re: /\b(?:which|what)\s+(?:approach|pattern|strategy|method|way)\b/i, kind: "ambiguous_choice" },
  { re: /\b(?:option\s+[A-D]|approach\s+[A-D]|plan\s+[A-D])\b/i, kind: "ambiguous_choice" },
  { re: /\bvs\.?\b|\bversus\b|\bor\s+(?:should|would|could)\b/i, kind: "ambiguous_choice" },
  { re: /\bnot\s+sure\s+(?:if|whether|about|which)\b/i, kind: "ambiguous_choice" },
  { re: /\b(?:trade[-\s]?offs?|pros?\s+(?:and|&)\s+cons?)\b/i, kind: "ambiguous_choice" },

  // === 英文 — 模糊范围 ===
  { re: /\b(?:clean\s*up|tidy\s*up|remove\s+(?:old|unused|dead))\b/i, kind: "vague_scope" },
  { re: /\b(?:refactor|restructure|reorganize)\s+(?:this|it|things?|stuff)\b/i, kind: "vague_scope" },
  { re: /\b(?:fix|improve|optimize)\s+(?:this|it|things?|stuff)\b/i, kind: "vague_scope" },

  // === 英文 — 矛盾方向 ===
  { re: /\b(?:simple|minimal)\b.{1,40}\b(?:but|yet|however).{1,40}\b(?:complete|comprehensive|robust)\b/i, kind: "contradictory" },
  { re: /\b(?:fast|quick)\b.{1,40}\b(?:but|yet|however).{1,40}\b(?:thorough|careful|proper)\b/i, kind: "contradictory" },

  // === 英文 — 缺失上下文 ===
  { re: /\b(?:fix|change|update|modify)\s+(?:this|it)\b$/i, kind: "missing_context" },
  { re: /\bsomething(?:'s|\s+is)\s+(?:wrong|off|broken|weird)\b/i, kind: "missing_context" },
];

// ── 自主决策授权:用户已明确放手 ──
const AUTONOMY_SIGNALS = [
  // 中文
  /放手干|你决定|随便选|你来定|你看着办|自己选|别问了|不用问/,
  /直接(?:改|做|实现|选|定)/,
  // 英文
  /\byou\s+decide\b/i,
  /\bjust\s+(?:do|pick|choose|go\s+(?:ahead|with))\b/i,
  /\bdon'?t\s+ask\b/i,
  /\byour\s+(?:call|choice|pick)\b/i,
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt: string) {
  const hits = [];
  for (const { re, kind } of AMBIGUITY_SIGNALS) {
    const match = prompt.match(re);
    if (match) {
      hits.push({ kind, snippet: match[0].trim() });
    }
  }
  return hits;
}

function isAutonomyGranted(prompt: string) {
  return AUTONOMY_SIGNALS.some((re) => re.test(prompt));
}

export async function run(payload: NormalizedHookPayload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;

  // 斜杠命令不扫
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  // 用户已授权自主决策 → 放行
  if (isAutonomyGranted(trimmed)) return null;

  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels: Record<string, string> = {
    ambiguous_choice: "方案选择歧义",
    vague_scope: "操作范围模糊",
    contradictory: "矛盾方向",
    missing_context: "缺失关键上下文",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Confusion Protocol] 高歧义决策检测 触发",
      "",
      "检测到当前 prompt 含有**可能导致方向错误**的歧义信号。在做出决策前,",
      "必须先按下面的协议停下来确认。",
      "",
      `  歧义类型:${kinds}`,
      `  命中片段:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── Confusion Protocol ──",
      "",
      "当遇到以下高风险歧义时,STOP,不要猜,不要挑一个先做:",
      "",
      "  1. 两个以上可行的架构或数据模型方案",
      "  2. 请求与已有代码模式矛盾,不确定该遵循哪个",
      "  3. 破坏性操作(删除/重写/迁移)的范围不明确",
      "  4. 缺少关键上下文,而该上下文会显著改变方案",
      "",
      "── 执行步骤 ──",
      "",
      "  Step 1. 命名歧义 — 用一句话说清楚「不确定的是什么」",
      "    例:「不确定是把状态放在组件内还是提升到 store」",
      "    例:「不确定 '清理旧的' 是指删除 deprecated API 还是移除测试 fixture」",
      "",
      "  Step 2. 呈现选项 — 列 2-3 个具体选项,每个附带:",
      "    • 一句话描述做法",
      "    • 核心取舍(会得到什么/会失去什么)",
      "    • 影响范围(改几个文件/影响几个调用方)",
      "",
      "  Step 3. 给出推荐 — 说明你倾向哪个,以及倾向的理由",
      "    但明确声明:「你有我没有的上下文,请确认」",
      "",
      "  Step 4. 等待用户回复 — 不要在同一轮开始实现",
      "",
      "── 何时不适用 ──",
      "",
      "  • 低风险改动(改注释/改常量/改格式):直接做",
      "  • 用户指令已经足够具体(指定了文件/函数/行):直接做",
      "  • 用户明确说了「放手干/你决定/别问了」:直接做",
      "  • 只有一种合理方案:直接做,不用制造选择困难",
      "",
      "── 核心原则 ──",
      "",
      "  • 在高风险决策点先问的成本 ≈ 0(一个问题,10 秒)",
      "  • 猜错方向后回退的成本 ≈ 高(重做,丢弃已写代码,可能丢数据)",
      "  • 不确定时问 > 不确定时猜",
      "  • 两个模型/方案看起来都对 ≠ 都对,往往有用户才知道的约束",
    ].join("\n"),
  };
}
