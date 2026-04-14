/**
 * over-engineering-primer (UserPromptSubmit) — 检测过度设计风险信号并注入
 * KISS / YAGNI / 三次法则 的克制提示
 *
 * 行为:
 *   当用户消息中出现「兼容/向后兼容/双轨/降级/回退/feature flag/抽一层/
 *   基类/工厂模式/策略模式/防御式/吞掉异常/backward compat/fallback…」等
 *   **可能诱发过度设计**的关键词时,本 hook 向 Claude 注入一段 additionalContext,
 *   强制 Claude 在动手写代码前先按「动手前三连自问」做一次克制检查,再决定
 *   是否真的要加这层抽象 / 兼容 / 防御。
 *
 * 为什么要这么做:
 *   全局 CLAUDE.md 明令「坚持 SOLID / KISS / DRY / YAGNI,不要降级,不要兼容,
 *   fail first 原则」,但这条写在系统提示里的硬规则,在实际对话中会被后续
 *   上下文稀释 —— 历史会话的纠正话题里 over_engineering 达 71 条(审计
 *   报告话题第 4 大),典型场景是:用户让 AI 新增一个功能,AI 自作主张加了
 *   feature flag + 新旧路径双轨 + fallback 兜底,用户「别降级、别兼容」
 *   纠正一次,下一个会话又犯。参照 investigation-primer / debug-methodology-primer
 *   的模式:把触发时机从「Claude 自觉」改成「UserPromptSubmit 机械匹配」,
 *   让克制原则在 prompt 抵达的同一时刻就出现。
 *
 *   与 feedback-detector 的关系:**正交**。feedback-detector 在用户**已经给出
 *   纠正**时触发 reflection 流程;本 hook 在用户**尚未纠正但场景容易引发
 *   过度设计**时预防。两者可同时注入,dispatch.mjs 会合并成一次 additionalContext,
 *   冗余可接受。
 *
 *   与 investigation-primer 的关系:**正交**。investigation 讲「动手前摸清家底」,
 *   本 hook 讲「动手时保持克制」。前者管「做什么」,后者管「不做什么」。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不禁止所有抽象 / 兼容 / 防御 —— 只提醒先按三连自问过一遍
 *   - 不替代 CLAUDE.md 的核心要求,而是把那条规则机械化触发
 *   - 不做任何本仓库特定的维护动作
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫
 *   - 未命中任一风险关键词
 *   - 命中了但同时含「用户明确要求」的强信号(例如「必须兼容旧 API」、
 *     「务必保留原路径」、「强制双写」、「线上还有老版本在用」),说明
 *     兼容 / 双轨 / feature flag 是硬需求,不触发 —— 否则会与用户要求打架
 */

// ── 过度设计风险信号 ──
//
// kind:
//   compat       兼容层 / 双轨 / 降级 / 回退
//   abstraction  过度抽象 / 设计模式堆叠 / 抽一层
//   defensive    过度防御 / 吞异常 / 内部代码全参校验
//   toggle       Feature flag / 灰度开关
//
// 设计取舍:
//   - 只捕捉「典型诱发词」,不捕捉普通动词(例如不扫 "add" / "make")。
//     触发条件要比 investigation-primer 窄 —— 这里针对「已经决定动手
//     但方式可能过度设计」的场景,投机抽象才是打击目标。
//   - 英文词全部加 \b 边界;中文无词边界,靠常见搭配限定。
//   - 高误伤词(例如「接口」单字)不保留 —— HTTP 接口 / API 接口 / 命令行接口
//     都不是过度抽象的信号。只保留「抽象接口 / interface 基类 / 工厂模式」
//     这种明确指向投机抽象的搭配。
const RISK_SIGNALS = [
  // === 中文 — 兼容层 / 双轨 / 降级 ===
  { re: /向后兼容|向下兼容|保持兼容|兼容(?:旧|老|原)(?:版|接口|API|行为)?/, kind: "compat" },
  { re: /降级(?:方案|策略|处理|逻辑)?|回退(?:方案|策略|逻辑|路径)?|兜底(?:方案|逻辑|处理)?/, kind: "compat" },
  { re: /双轨|并存|两套(?:逻辑|代码|实现|路径)|新老(?:并存|共存|切换)/, kind: "compat" },
  { re: /(?:平滑|渐进式|灰度)(?:过渡|迁移|切换|下线)/, kind: "compat" },
  { re: /同时支持(?:新旧|老新|旧和新|两种)/, kind: "compat" },

  // === 中文 — 过度抽象 ===
  { re: /抽(?:一|出)一?层|加一?层(?:抽象|封装|wrapper)|封装一?层/i, kind: "abstraction" },
  { re: /抽象(?:出|成)|提取(?:成|出|到)(?:基类|抽象类|抽象接口)/, kind: "abstraction" },
  { re: /做一?个(?:基类|抽象类|抽象接口|工厂|策略类|适配器|装饰器|单例|观察者)/, kind: "abstraction" },
  { re: /(?:工厂|策略|适配器|装饰器|单例|观察者|建造者|模板方法|责任链)模式/, kind: "abstraction" },
  { re: /依赖注入(?:框架|容器)|\bIoC\s*容器/i, kind: "abstraction" },
  { re: /面向(?:接口|抽象)(?:编程|设计)/, kind: "abstraction" },

  // === 中文 — 过度防御 ===
  { re: /防御式(?:编程|写法|代码)?|防御性(?:编程|代码|校验)/, kind: "defensive" },
  { re: /try\s*(?:\/|\\)?\s*catch\s*(?:包一?下|把|包住|兜一?下|捕获所有)/i, kind: "defensive" },
  { re: /吞(?:掉|下)(?:异常|错误)|catch\s*(?:住|掉)(?:所有|全部)/i, kind: "defensive" },
  { re: /(?:所有|每个|全部)(?:参数|输入|调用|函数)都(?:校验|检查|验证|加\s*null\s*check)/i, kind: "defensive" },
  { re: /加一?层\s*null\s*check|到处\s*null\s*check/i, kind: "defensive" },

  // === 中文 — Feature flag ===
  { re: /(?:功能|特性)(?:开关|标志|flag|toggle)/i, kind: "toggle" },
  { re: /灰度(?:发布|上线|控制|开关)|\bA\/?B\s*测试(?:开关|切换|框架)/i, kind: "toggle" },

  // === 英文 — 兼容层 ===
  { re: /\bbackward[s]?\s*compat(?:ible|ibility)?\b/i, kind: "compat" },
  { re: /\bback[-\s]?compat\b/i, kind: "compat" },
  { re: /\bfallback\s+(?:logic|path|handler|mechanism|strategy|behavior)\b/i, kind: "compat" },
  { re: /\bdual[-\s]?(?:write|read|path|run)\b/i, kind: "compat" },
  { re: /\bside[-\s]?by[-\s]?side\s+(?:impl|implementation|run|deploy)/i, kind: "compat" },
  { re: /\bgraceful(?:ly)?\s+degrade\b|\bgraceful\s+degradation\b/i, kind: "compat" },
  { re: /\blegacy\s+(?:support|path|shim|wrapper)\b/i, kind: "compat" },

  // === 英文 — 过度抽象 ===
  { re: /\babstract(?:ion)?\s+layer\b|\babstraction\s+over\b/i, kind: "abstraction" },
  { re: /\b(?:abstract\s+)?base\s+class\b/i, kind: "abstraction" },
  { re: /\b(?:factory|strategy|adapter|decorator|observer|builder|singleton|visitor)\s+pattern\b/i, kind: "abstraction" },
  { re: /\bextract\s+(?:an?\s+)?(?:interface|base\s*class)\b/i, kind: "abstraction" },
  { re: /\bdependency\s+injection\s+(?:container|framework)\b/i, kind: "abstraction" },
  { re: /\bprogram(?:ming)?\s+to\s+(?:an?\s+)?interface\b/i, kind: "abstraction" },

  // === 英文 — 过度防御 ===
  { re: /\bdefensive\s+(?:programming|coding|check|validation)\b/i, kind: "defensive" },
  { re: /\bwrap\s+(?:it\s+)?(?:in|with)\s+(?:a\s+)?try[-\s/]?catch\b/i, kind: "defensive" },
  { re: /\bswallow\s+(?:the\s+|all\s+)?(?:exception|error)s?\b/i, kind: "defensive" },
  { re: /\bcatch[-\s]?all\s+(?:handler|block)\b/i, kind: "defensive" },

  // === 英文 — Feature flag ===
  { re: /\bfeature\s+(?:flag|toggle|gate|switch)\b/i, kind: "toggle" },
  { re: /\bcanary\s+(?:release|deploy|rollout)\b/i, kind: "toggle" },
];

// ── 强信号:用户已明确要求兼容 / 双轨 / feature flag ──
//
// 只要命中以下任一,就放行本 hook —— 此时兼容 / 双轨 / 保留旧路径是用户
// 硬需求,不是自作主张,不应再提醒「别做」与用户要求打架。
//
// 设计取舍:
//   - 强信号要求「必须 / 务必 / 强制 / 不能破坏」等明确措辞,只靠「兼容」
//     单字不构成强信号 —— 因为用户也可能是来问「能不能不兼容」。
//   - 有线上 / 生产上还在用的事实陈述也算强信号 —— 这是业务约束,不是
//     技术偏好。
const USER_REQUIRED_SIGNALS = [
  // 中文 — 明确要求
  /必须(?:兼容|保留|支持|保持)(?:旧|老|原|现有|已有)/,
  /务必(?:保留|保持|兼容|支持)(?:旧|老|原|现有|已有)/,
  /强制(?:双写|并存|兼容|保留)/,
  /(?:不能|不要|别|禁止)(?:破坏|删除|移除|去掉)(?:现有|已有|原有|旧的)(?:接口|API|路径|行为|逻辑)/,
  // 中文 — 业务约束陈述
  /(?:线上|生产|prod)(?:还在|仍在|正在)(?:用|使用|跑|运行)/i,
  /(?:用户|客户)(?:还在|仍在|正在)(?:用|使用)(?:旧|老)/,
  /(?:有|存在)(?:历史数据|历史版本|老数据|旧数据)(?:需要|要)(?:迁移|兼容|转换)/,
  // 英文
  /\bmust\s+(?:keep|preserve|maintain|support)\s+(?:backward|old|existing|legacy)\b/i,
  /\bcan(?:no)?'?t\s+break\s+(?:existing|current|production|legacy)\b/i,
  /\brequired\s+(?:for|by)\s+(?:migration|rollback|compatibility)\b/i,
  /\bwe\s+still\s+have\s+(?:users|clients|customers)\s+on\s+(?:the\s+)?(?:old|legacy)\b/i,
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt) {
  const hits = [];
  for (const { re, kind } of RISK_SIGNALS) {
    const match = prompt.match(re);
    if (match) {
      hits.push({ kind, snippet: match[0].trim() });
    }
  }
  return hits;
}

function isUserRequired(prompt) {
  return USER_REQUIRED_SIGNALS.some((re) => re.test(prompt));
}

export async function run(payload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;

  // 斜杠命令(slash command)不扫,避免对 /xxx 类调用误触
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  // 用户明确要求兼容 / 双轨 / 保留旧路径 → 放行,不注入
  if (isUserRequired(trimmed)) return null;

  // 按 kind 去重 + 聚合命中片段(最多展示 5 条,避免注入过长)
  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels = {
    compat: "兼容层/双轨/降级",
    abstraction: "过度抽象",
    defensive: "过度防御",
    toggle: "Feature flag/灰度",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Over-Engineering Primer] 过度设计风险 触发",
      "",
      "检测到当前 prompt 含有**可能诱发过度设计**的关键词。在动手写代码前,",
      "必须先按下面三连自问过一遍,再决定是否真的要加这层抽象 / 兼容 / 防御。",
      "(本段依据全局 CLAUDE.md「核心要求 → 坚持 SOLID / KISS / DRY / YAGNI,",
      "不要降级、不要兼容、fail first 原则」,已脱离本仓库上下文,适用于",
      "任何工程场景。)",
      "",
      `  风险类型:${kinds}`,
      `  命中片段:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── 动手前三连自问 ──",
      "",
      "Q1. 用户是否**明确要求**这一层?",
      "   • 如果用户没说「必须兼容旧 API / 务必保留旧路径 / 强制双写」,",
      "     那兼容层、双轨、feature flag 都不是需求,是你自作主张",
      "   • 全局 CLAUDE.md 硬规则:「除非用户明确要求,不要主动加入兼容层、",
      "     回退逻辑或双轨逻辑」",
      "   • 不确定就问用户,不要擅自扩大范围;宁可少做一层,也不要自作多情",
      "",
      "Q2. 三次法则 —— 真有 3 次复用证据吗?",
      "   • 用了 1 次 → 不抽象,保持内联",
      "   • 用了 2 次 → 可以考虑提取",
      "   • 用了 3 次 → 必须抽象",
      "   • 只有 1 处调用就抽基类 / 工厂 / 策略模式 → 投机抽象,删掉",
      "   • 一个计数器不需要工厂模式 + 观察者模式 + 依赖注入",
      "   • 三次法则的反向用法:如果删掉这个抽象,系统照常跑 → 过度设计",
      "",
      "Q3. 症状还是根因?",
      "   • 准备加 try-catch 吞异常 / null check / 放宽 schema 前先问:",
      "     这个异常 / null / 非法值**本应发生吗**?",
      "   • 答案是「本来就不该发生」→ 去堵**上游源头**,不要在下游兜底",
      "   • 下游防御只有在「证明上游修了还不够」时才合法",
      "   • 禁止修错层:不要为了让症状消失就在调用方加防御,要问「调用方",
      "     为什么会传进来这个值」",
      "",
      "── 具体红线 ──",
      "",
      "  • 不要降级、不要兼容、fail first —— 全局 CLAUDE.md 明文硬规则",
      "  • 禁止投机抽象:没有 3 次复用证据就别抽 interface / base class / 工厂",
      "  • 禁止过度防御:内部代码之间默认可信,只在系统边界(用户输入、",
      "    外部 API、持久化层反序列化)校验",
      "  • 禁止越界:一次任务只解决一个核心问题,不要「顺手」加 feature flag、",
      "    加监控、加配置化、加国际化",
      "  • 禁止「backwards-compat 幽灵」:重命名 _vars、re-export 旧类型、",
      "    留「// removed」注释 —— 确认无人用就直接删",
      "",
      "── 何时可以保留 ──",
      "",
      "  • 用户明确用「必须 / 务必 / 强制」要求兼容 / 双轨 / feature flag",
      "  • 数据迁移场景:双写 + 回滚窗口是业务硬需求",
      "  • 真实多处复用:3+ 现存调用点(不是「将来可能会有」)",
      "  • 系统边界:用户输入、第三方 API 响应、外部配置 —— 必须校验",
      "  • 已有同类抽象可复用 —— 优先复用,不要另起炉灶",
      "",
      "依据:全局 CLAUDE.md「核心要求 → 不要降级、不要兼容、fail first 原则」",
      "     + 「工程思维框架 → 三次法则 / 复用先于创造」+ 「代码质量红线」,",
      "     本 hook 负责把这些规则从「靠自觉」升级为「UserPromptSubmit 机械",
      "     触发」,降低被后续上下文稀释的概率。无对应 skill 文件,职责直接",
      "     由本 hook 承担。",
    ].join("\n"),
  };
}
