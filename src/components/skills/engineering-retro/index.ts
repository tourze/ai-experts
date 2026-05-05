import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const engineeringRetroSkill = defineSkill({
  id: "engineering-retro",
  fullName: "工程回顾",
  description: "当用户需要基于 git log 回顾近期开发进度、提交节奏、热点文件、协作模式或工程复盘指标时使用。也用于从代码变更提炼工程经验。",
  useCases: [
    "用户要按 `24h`、`7d`、`14d`、`30d` 回顾最近交付情况。",
    "需要从 Git 历史提炼开发节奏、热点模块、提交聚焦度和作者亮点。",
    "单仓库或 monorepo 子目录都要支持，例如 `/engineering-retro 14d services/api`。",
  ],
  constraints: [
    "默认只读：不改分支、不改索引、不改工作树，也不要顺手修改 `.gitignore`。",
    "若用户明确要求保留快照供下次环比，才允许在 `.engineering-retros/` 写 JSON；否则只输出报告。",
    "默认分支必须动态探测，失败就明确说明，禁止猜 `main` 或 `master`。",
    "时区必须取系统实际值 `date +%Z`，不要写死。",
    "需要尊重路径范围；一旦传了 `PATH_SCOPE`，所有 Git 命令都要带 `-- <PATH_SCOPE>`。",
    "作者统计只用于说明贡献分布，不做绩效评价。",
  ],
  checklist: [
    "默认分支和时区是否来自实时探测。",
    "`PATH_SCOPE` 是否在所有 Git 命令里都被带上。",
    "提交分类是否先看 Conventional Commit 前缀，再用 diff 特征兜底。",
    "PR 统计是否在 GitHub/`gh` 不可用时优雅跳过。",
    "若用户没要求落盘，是否保持纯只读输出。",
    "若需要环比，是否明确说明使用了本次或历史快照。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只读但默认写文件",
      pass: "显式开关",
    }),
    defineAntiPattern({
      fail: "作者统计当绩效",
      pass: "中性描述贡献分布",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "工程回顾中的常见反模式，包括解读偏差和无效指标。",
      loadWhen: "需要避免工程回顾中的常见误区或审查回顾报告的质量时读取。",
    }),
    defineReference({
      id: "lesson-learned",
      source: new URL("./references/lesson-learned.md", import.meta.url),
      target: "references/lesson-learned.md",
      title: "lesson-learned.md",
      summary: "从代码变更中提炼可复用工程经验的方法与模板。",
      loadWhen: "需要从 git 历史或项目经历中提取可复用的经验教训时读取。",
    }),
    defineReference({
      id: "se-principles",
      source: new URL("./references/se-principles.md", import.meta.url),
      target: "references/se-principles.md",
      title: "se-principles.md",
      summary: "工程回顾中评估代码健康度所用的软件工程原则与判定标准。",
      loadWhen: "需要基于软件工程原则评估代码变更质量或判断技术债务时读取。",
    }),
  ],
});
