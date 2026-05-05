import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const codeReviewSkill = defineSkill({
  id: "code-review",
  fullName: "代码审查",
  description: "当用户要求审查代码质量、发现命名或职责问题、检查错误处理和边界情况时使用。支持标准/高压两档强度——高压模式由 brutal-honesty-review 合并而来。",
  useCases: [
    "用户提交代码或文件，要求找出逻辑和设计层面的问题。",
    "关注\"代码写得好不好\"，不是\"能不能上线\"（那用 `pre-landing-review`）。",
    "交叉引用：降低复杂度配合 `complexity-reducer`；测试质量审查配合 `test-quality-review`。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "先读真实代码或 diff，不凭猜测。",
    "不审查纯风格问题（缩进、括号、行长度）——那是 linter 的事。",
    "每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。",
    "按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。参考 [references/dimensions.md](./references/dimensions.md) 的严重度指引和\"不应标记\"规则。",
    "审查结束输出 **Health Score**（100 分制），格式见 [references/health-score.md](./references/health-score.md)。",
    "无问题则明确说明，不硬凑——100 分是合法的。",
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
      id: "assess-code",
      entry: new URL("./scripts/assess-code.mjs", import.meta.url),
      target: "scripts/assess-code.mjs",
      runtime: "node",
      bundle: false,
      description: "Script assess-code.mjs.",
    }),
    defineSkillScript({
      id: "assess-tests",
      entry: new URL("./scripts/assess-tests.mjs", import.meta.url),
      target: "scripts/assess-tests.mjs",
      runtime: "node",
      bundle: false,
      description: "Script assess-tests.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "brutal-mode",
      source: new URL("./references/brutal-mode.md", import.meta.url),
      target: "references/brutal-mode.md",
      title: "brutal-mode.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dimensions",
      source: new URL("./references/dimensions.md", import.meta.url),
      target: "references/dimensions.md",
      title: "dimensions.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "health-score",
      source: new URL("./references/health-score.md", import.meta.url),
      target: "references/health-score.md",
      title: "health-score.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "receiving-code-review",
      source: new URL("./references/receiving-code-review.md", import.meta.url),
      target: "references/receiving-code-review.md",
      title: "receiving-code-review.md",
      summary: "Reference material for code-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
