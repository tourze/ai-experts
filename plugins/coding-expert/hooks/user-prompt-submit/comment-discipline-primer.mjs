/**
 * comment-discipline-primer (UserPromptSubmit) — 检测注释/契约/并发/WORKAROUND
 * 信号并注入「代码说是什么，注释说为什么」的注释纪律。
 *
 * 行为:
 *   当用户消息中出现注释请求（注释/comment/docstring）、临时绕过
 *   （HACK/workaround/临时方案）、外部契约（前置条件/假设/副作用/契约）、
 *   或并发语义（并发/锁/mutex/channel/atomic/race）等信号时，
 *   本 hook 向 Claude 注入一段 additionalContext，把原 memory/AGENTS.md
 *   里的「代码注释规范」细化为可执行的检查清单。
 *
 * 为什么要这么做:
 *   代码注释规范属于通用编码纪律，但直接长期塞在全局 memory 中太长，
 *   会和其他规则竞争注意力。参照 investigation-primer 与
 *   over-engineering-primer 的做法，把详细规范迁到 UserPromptSubmit：
 *   只有当任务真的触及注释、契约、并发或 workaround 场景时才注入，
 *   既减少常驻噪音，也保留战术细节。
 *
 * 非目标:
 *   - 不 block，只注入 context
 *   - 不要求“所有代码都写很多注释”；目标是减少无效注释，保留必要 WHY
 *   - 不替代语言专用文档规范（Rust doc comments / JSDoc / PHPDoc 等）
 *   - 不在 hook 内自动读文件或检查具体注释内容
 *
 * 放行条件:
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫
 *   - 未命中任一注释纪律信号
 */

const COMMENT_SIGNALS = [
  // === 中文 — 注释请求 ===
  { re: /注释|补注释|加注释|注释规范|注释写法|代码注释/, kind: "comment" },
  { re: /文档注释|接口注释|函数注释|说明一下(?:为什么|原因|约束)?/, kind: "comment" },

  // === 中文 — workaround / 设计决策 ===
  { re: /\bHACK\b|\bWORKAROUND\b/i, kind: "workaround" },
  { re: /临时方案|临时绕过|绕过方案|兜一下|先这么写|权衡|取舍|设计决策/, kind: "workaround" },
  { re: /为什么这样写|为什么这么写|原因是|这么做的原因/, kind: "workaround" },

  // === 中文 — 契约 / 约束 ===
  { re: /前置条件|后置条件|调用方责任|契约|假设|副作用|顺序要求|输入范围/, kind: "contract" },
  { re: /线程安全|非线程安全|未定义行为|边界条件|外部约束/, kind: "contract" },

  // === 中文 — 并发 ===
  { re: /并发|竞态|锁|互斥|原子|内存序|信号量|channel|线程/i, kind: "concurrency" },
  { re: /顺序保证|共享状态|可见性|死锁/, kind: "concurrency" },

  // === 英文 — comments ===
  { re: /\bcomment\b|\bcomments\b|\bdocstring\b|\bdoc comment\b/i, kind: "comment" },
  { re: /\bwhy comment\b|\bcode comments?\b/i, kind: "comment" },

  // === 英文 — workaround / rationale ===
  { re: /\bHACK\b|\bWORKAROUND\b/i, kind: "workaround" },
  { re: /\bworkaround\b|\btrade[-\s]?off\b|\brationale\b|\bdesign decision\b/i, kind: "workaround" },

  // === 英文 — contract ===
  { re: /\bprecondition\b|\bpostcondition\b|\bcontract\b|\bassumption\b|\bside[-\s]?effect\b/i, kind: "contract" },
  { re: /\bcaller responsibility\b|\bundefined behavior\b/i, kind: "contract" },

  // === 英文 — concurrency ===
  { re: /\bconcurren(?:cy|t)\b|\brace condition\b|\bmutex\b|\batomic\b|\bmemory order\b/i, kind: "concurrency" },
  { re: /\bchannel\b|\bsemaphore\b|\bthread[-\s]?safe\b|\bshared state\b|\bdeadlock\b/i, kind: "concurrency" },
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt) {
  const hits = [];

  for (const { re, kind } of COMMENT_SIGNALS) {
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
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  const kindSet = new Set(hits.map((hit) => hit.kind));
  const snippets = [...new Set(hits.map((hit) => hit.snippet))].slice(0, 5);
  const kindLabels = {
    comment: "注释请求",
    workaround: "设计决策 / workaround",
    contract: "契约 / 假设 / 副作用",
    concurrency: "并发 / 共享状态",
  };
  const kinds = [...kindSet].map((kind) => kindLabels[kind] || kind).join("、");

  return {
    decision: "context",
    reason: [
      "[Comment Discipline Primer] 注释纪律 触发",
      "",
      "检测到当前任务触及注释、契约、并发或 workaround 场景。写代码时请遵守：",
      "代码说“是什么”，注释说“为什么”。不要把注释写成代码翻译。",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((snippet) => `「${snippet}」`).join("、")}`,
      "",
      "── 必须注释的四类信息 ──",
      "",
      "1. 设计决策",
      "   说明为什么选这个方案、放弃了什么方案、未来在什么条件下可以回退或替换。",
      "",
      "2. HACK / WORKAROUND",
      "   必须写清：当前在绕过什么问题、为什么暂时这样做、何时/如何解除。",
      "",
      "3. 外部约束与契约",
      "   说明前置条件、假设、调用方责任、参数范围、调用顺序、副作用。",
      "",
      "4. 并发与内存模型",
      "   说明保护的共享状态、为什么选这个同步原语、顺序保证依赖什么。",
      "",
      "── 反模式 ──",
      "",
      "  • 翻译代码：`i++ // i 加 1` 这种注释直接删",
      "  • 掩盖烂代码：如果注释在解释“这段代码到底在做什么”，先重构命名和结构",
      "  • 过时注释：改代码时必须同步改注释；不确定就删",
      "  • 署名/日志式注释：交给 git blame，不要写进源码",
      "  • 注释掉的代码：直接删除，版本控制会记住",
      "",
      "── 执行顺序 ──",
      "",
      "  1. 先让代码通过命名和结构自解释“是什么”",
      "  2. 再补代码无法表达的 WHY / 约束 / 取舍",
      "  3. 如果你准备写长段注释解释流程本身，优先考虑拆函数或提取模块",
      "",
      "── 快速自检 ──",
      "",
      "  • 这段代码是否会让后来者想“优化”回错误方案？如果会，补设计决策注释",
      "  • 这段代码是否在绕过已知坑？如果是，补 HACK/WORKAROUND 注释",
      "  • 这段代码是否依赖隐式输入/顺序/环境假设？如果是，补契约注释",
      "  • 这段代码是否涉及锁、原子、channel、共享状态？如果是，补并发注释",
      "",
      "依据：原 memory/AGENTS.md「代码注释规范」已迁为按需注入的 hook 规则。",
    ].join("\n"),
  };
}
