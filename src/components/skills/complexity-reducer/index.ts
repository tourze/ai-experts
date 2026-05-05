import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const complexityReducerSkill = defineSkill({
  id: "complexity-reducer",
  fullName: "复杂度识别与简化",
  description: "当代码过于复杂、嵌套太深、函数太长、耦合严重，或用户要求简化代码、清理命名、降低复杂度时使用。",
  useCases: [
    "代码能跑但难以理解、修改和测试。",
    "函数超长、嵌套超深、参数超多、条件超复杂。",
    "上线前做可维护性整理，而不是功能性重写。",
    "交叉引用：重构流程纪律配合 `refactoring-checklist`；具体重构手法配合 `architecture-expert/refactoring-patterns`；审查结果配合 `code-review`；设计原则参考 `software-design`；完成前验证检查清单见 [references/verification-checklist.md](./references/verification-checklist.md)。",
  ],
  constraints: [
    "目标是降低认知复杂度，不是减少行数。",
    "先定位复杂度来源，再决定策略。",
    "每次简化保持行为不变——这是重构不是重写。",
    "本质复杂度（业务规则就是复杂的）不强行简化逻辑，而是改善组织。",
    "简化后必须更容易理解，不是更\"巧妙\"。",
  ],
  checklist: [
    "已识别最主要的复杂度来源",
    "简化策略与来源匹配",
    "每次简化保持行为不变",
    "简化后更容易理解（不只是更短）",
    "没有引入新复杂度（如过度抽象）",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "为减少行数牺牲可读性：一行做了过滤、计算、归并三件事，无法断点调试，出错无法定位。",
      pass: "分步命名，每步可验证",
    }),
    defineAntiPattern({
      fail: "只移动复杂度不消除",
      pass: "用查找表消除分支",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "complexity-report",
      entry: new URL("./scripts/complexity_report.mjs", import.meta.url),
      target: "scripts/complexity_report.mjs",
      runtime: "node",
      bundle: false,
      description: "Script complexity_report.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "go",
      source: new URL("./references/go.md", import.meta.url),
      target: "references/go.md",
      title: "go.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "python",
      source: new URL("./references/python.md", import.meta.url),
      target: "references/python.md",
      title: "python.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rust",
      source: new URL("./references/rust.md", import.meta.url),
      target: "references/rust.md",
      title: "rust.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "task-closure",
      source: new URL("./references/task-closure.md", import.meta.url),
      target: "references/task-closure.md",
      title: "task-closure.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "typescript",
      source: new URL("./references/typescript.md", import.meta.url),
      target: "references/typescript.md",
      title: "typescript.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "verification-checklist",
      source: new URL("./references/verification-checklist.md", import.meta.url),
      target: "references/verification-checklist.md",
      title: "verification-checklist.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
