/**
 * investigation-primer (UserPromptSubmit) — 检测编码任务意图并注入「调查先行」四步方法论
 *
 * 行为:
 *   当用户消息中出现「实现 / 修复 / 重构 / 改 / 优化 / add / fix / refactor /
 *   change / implement…」等编码任务动词时,本 hook 向 Claude 注入一段
 *   additionalContext,内容是 CLAUDE.md「工程思维框架 → 调查先行」硬规则
 *   的战术四步(定位 → 依赖 → 测试 → 风格),强制 Claude 在 Edit/Write 之前
 *   先用 Grep/Glob/Read 摸清家底。
 *
 * 为什么要这么做:
 *   CLAUDE.md 已经明令「没有调查就没有发言权」,但写在系统提示里的硬规则
 *   会被后续对话和工具结果稀释 —— 大量任务里 Claude 拿到 prompt 就直接
 *   开 Edit/Write,根本没 Grep 过项目。参照 feedback-detector 的模式:把
 *   触发时机从「靠 LLM 自觉」改为「UserPromptSubmit 事件机械匹配」,让
 *   「先搜索再动手」的四步方法论在用户 prompt 抵达的同一时刻出现,降低
 *   被后续上下文覆盖的概率。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不替代 CLAUDE.md 的原规则,而是把那条规则实例化为可执行的四步
 *   - 不指定必须 Grep 哪些关键词;关键词从 prompt 里由 Claude 自行抽取
 *   - 不在 hook 内部自动跑 Grep —— hook 拿不到项目根,也不应阻塞 prompt
 *   - 不做任何本仓库特定的维护动作(例如写盘到特定目录)
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 12 字符)避免误触闲聊/确认
 *   - 斜杠命令(/xxx)不扫,避免对 skill 调用误触
 *   - 未命中任一任务动词
 */

// ── 任务动词:正则 + 类型分类 ──
// kind:new (新建/实现) / fix (修复) / refactor (重构) / modify (修改/更新) / remove (删除)
//
// 设计取舍:
//   - 宁可多触发,不可漏触发 —— 本 hook 只注入 context,false positive 的代价
//     仅为多读一段文字,而 false negative 意味着「应该先调查却没调查」继续发生。
//   - 英文动词全部加 \b 词边界,避免嵌入匹配(例如 padding 里的 add)。
//   - 中文动词无词边界概念,只能靠常见搭配限定(例如「实现一个」「修一下」)。
const TASK_SIGNALS = [
  // === 中文 — 新建/实现 ===
  { re: /实现(?:一?个|一?下)?/, kind: "new" },
  { re: /新增|新加|新建/, kind: "new" },
  { re: /添加|加一?个|加上|加入/, kind: "new" },
  { re: /做一?个|写一?个|创建|建一?个|搭建/, kind: "new" },
  // === 中文 — 修复 ===
  { re: /修复|修一?下|修好|搞定|解决/, kind: "fix" },
  { re: /bug|报错|异常|崩溃|死锁/i, kind: "fix" },
  { re: /挂了|挂掉|不工作|不生效|失效|跑不起来|打不开/, kind: "fix" },
  { re: /排查并修|排查一?下|定位问题/, kind: "fix" },
  // === 中文 — 重构 ===
  { re: /重构|重写|改写|拆分|合并|抽取|提取(?:成|出|到)/, kind: "refactor" },
  // === 中文 — 修改/更新 ===
  { re: /修改|更改|改一?下|调整|更新/, kind: "modify" },
  { re: /替换(?:为|成)?|换成|改成|重命名/, kind: "modify" },
  { re: /优化|改进|加速/, kind: "modify" },
  // === 中文 — 删除 ===
  { re: /删除|去掉|去除|移除|干掉|清掉|清除/, kind: "remove" },
  // === 英文 — 新建/实现 ===
  { re: /\b(?:implement|add|create|build|make|write|introduce|scaffold|set\s?up)\b/i, kind: "new" },
  // === 英文 — 修复 ===
  { re: /\b(?:fix|resolve|patch|repair|debug|troubleshoot)\b/i, kind: "fix" },
  { re: /\b(?:crash|error|failure|broken|not\s+working|doesn'?t\s+work)\b/i, kind: "fix" },
  // === 英文 — 重构 ===
  { re: /\b(?:refactor|rewrite|restructure|reorganize|extract|split|merge|modulari[sz]e)\b/i, kind: "refactor" },
  // === 英文 — 修改/更新 ===
  { re: /\b(?:change|modify|update|adjust|tweak|replace|rename|migrate|port)\b/i, kind: "modify" },
  { re: /\b(?:optimi[sz]e|improve|enhance|speed\s+up)\b/i, kind: "modify" },
  // === 英文 — 删除 ===
  { re: /\b(?:remove|delete|drop|strip|purge|clean\s+up)\b/i, kind: "remove" },
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt) {
  const hits = [];
  for (const { re, kind } of TASK_SIGNALS) {
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

  // 斜杠命令(slash command)不扫,避免对 skill 调用误触
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  // 按 kind 去重 + 聚合命中片段(最多展示 5 条,避免注入过长)
  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels = {
    new: "新建/实现",
    fix: "修复",
    refactor: "重构",
    modify: "修改/优化",
    remove: "删除",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Investigation Primer] 调查先行 触发",
      "",
      "检测到当前 prompt 属于编码任务。在任何 Edit/Write 之前,必须先按",
      "下面四步完成「家底摸清」再动手。(本段等价于 AGENTS.md「工程思维",
      "框架 → 调查先行:没有调查就没有发言权」的战术展开,已脱离本仓库",
      "上下文,适用于任何工程场景。)",
      "",
      `  任务类型:${kinds}`,
      `  命中动词:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── 调查先行 四步 ──",
      "",
      "1. 定位 (Scope) —— 用 Grep/Glob 圈出改什么 / 不改什么",
      "   把本次任务涉及的模块、函数、组件、文件具体圈出来。圈不到具体",
      "   路径就继续搜 —— 禁止在未定位到文件前就开始 Edit/Write。",
      "   产出:一份明确的「改什么 / 不改什么」文件清单。",
      "",
      "2. 依赖 (Dependencies) —— 反查谁在用它",
      "   对步骤 1 圈定的每个文件反查一次 Grep:谁 import 了它、谁调用了",
      "   它的导出符号。提前找出「改动会溅射到哪里」,而不是等 CI / 测试",
      "   报红才发现回归。",
      "   产出:影响半径清单 + 需要同步更新的调用点。",
      "",
      "3. 测试 (Tests) —— 先确认测试覆盖",
      "   Grep 对应的 test / spec / __tests__ / *_test / tests/ 文件。",
      "   没有测试覆盖就是红灯 —— 必须在动手前就告知用户「该模块无测试,",
      "   需先补或接受回归风险」,而不是改完才发现无法验证。",
      "   产出:已有测试清单 + 本次改动需要新增或更新的测试列表。",
      "",
      "4. 风格与相似实现 (Patterns) —— 读懂项目约定",
      "   Read 同层 2-3 个已有文件,摸清项目的命名、分层、错误处理、日志、",
      "   注释风格。若相似功能已存在,优先复用 / 改造,禁止另起炉灶。",
      "   产出:本次改动要遵循的约定 + 可复用的现有代码位置。",
      "",
      "── 附加原则 ──",
      "",
      "  • 证据优先:每一步都要有具体的 Grep/Glob/Read 输出,不是「我觉得」",
      "  • 先列清单再动手:Propose 阶段就把「改什么 / 影响什么 / 测什么」",
      "    落成文字,不确定就问用户,不要擅自扩大范围",
      "  • 禁止主观臆测:不凭想象写代码,不照搬外部模板而不看项目上下文",
      "  • 复用先于创造:项目已有的组件 / 工具 / 配置优先使用,不重复造轮子",
      "",
      "── 硬约束:未确认前不动手 ──",
      "",
      "  完成 1/2/3/4 后,先把「改什么文件 / 影响哪些调用点 / 测试怎么跑」",
      "  以清单形式输出给用户,等待用户明确回复「动手 / 开工 / 按此执行 /",
      "  OK / 可以 / 继续」等字样后,再进入 Edit/Write/NotebookEdit。",
      "",
      "  例外(无需等待确认,可直接进入实现):",
      "    • 用户在原始 prompt 里已明确指定具体文件和行范围",
      "    • 用户 prompt 里带「直接改 / 直接实现 / 别问了 / 放手干」等字样",
      "    • 只改文档 / 注释 / 常量值的 trivial 改动",
      "",
      "── 何时可以跳过或简化 ──",
      "",
      "  • 只改文档 / 注释 / 固定常量值:跳过 2/3,保留 1/4",
      "  • 用户已在 prompt 里指定具体文件和行范围:1 可简化,重点执行 2/3/4",
      "  • 改动 < 5 行且无逻辑分支:2 必做,其余酌情",
      "  • 纯问答 / 解释 / 评审类任务:投入 1/4,2/3 视需要",
    ].join("\n"),
  };
}
