/**
 * investigation-primer (UserPromptSubmit) — 检测编码任务意图并注入「调查先行」四步方法论
 *
 * 行为:
 *   当用户消息中出现「实现 / 修复 / 重构 / 改 / 优化 / add / fix / refactor /
 *   change / implement…」等编码任务动词时,本 hook 向 Claude 注入一段
 *   additionalContext,内容是记忆文件中的「工程思维框架 → 调查先行」硬规则
 *   的战术四步(定位 → 依赖 → 测试 → 风格),强制 Claude 在 Edit/Write 之前
 *   先用 Grep/Glob/Read 摸清家底。
 *
 * 为什么要这么做:
 *   记忆文件已经明令「没有调查就没有发言权」,但写在系统提示里的硬规则
 *   会被后续对话和工具结果稀释 —— 大量任务里 Claude 拿到 prompt 就直接
 *   开 Edit/Write,根本没 Grep 过项目。参照 feedback-detector 的模式:把
 *   触发时机从「靠 LLM 自觉」改为「UserPromptSubmit 事件机械匹配」,让
 *   「先搜索再动手」的四步方法论在用户 prompt 抵达的同一时刻出现,降低
 *   被后续上下文覆盖的概率。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不替代记忆文件的原规则,而是把那条规则实例化为可执行的四步
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
      "检测到当前 prompt 属于编码任务。先调查再动手，避免误改与回归。",
      "",
      `  任务类型:${kinds}`,
      `  命中动词:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── 调查先行 四步 ──",
      "",
      "1. Scope：先圈定改什么/不改什么文件。",
      "2. Dependencies：反查调用点与影响半径。",
      "3. Tests：确认现有覆盖与新增测试需求。",
      "4. Patterns：复用同层已有实现，保持风格一致。",
      "",
      "输出最小清单后再改代码：改动文件、影响调用点、验证命令。",
      "详细规则以全局记忆文件为准。",
    ].join("\n"),
  };
}
