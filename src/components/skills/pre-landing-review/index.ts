import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";

export const preLandingReviewSkill = defineSkill({
  id: "pre-landing-review",
  fullName: "落地前审查",
  description: "当用户需要判断代码是否可以合并或上线时使用。适用于 pre-merge review、gate check、上线前安全检查等请求。",
  useCases: [
    "用户要判断当前分支或指定 diff 是否可以合并。",
    "关注的是“会不会出事故”，不是一般性的代码美学讨论。",
    "需要围绕数据安全、并发、信任边界、测试缺口做阻断级判断。",
    "需要与 `testing-strategy` 配合，决定哪些风险必须补测后才能放行。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在”灵活变通”。**",
    "默认只读；除非用户明确要求”直接修”，否则先给审查结论。",
    "必须基于真实 diff，而不是凭目录猜风险。",
    "必须先读取 [references/checklist.md](./references/checklist.md)。",
    "所有问题按两级输出：\n- 阻断项：不解决或不确认风险，不能放行\n- 建议项：不阻断，但要记录",
    "每个阻断项都要给用户明确三选一：\n- `立即修复`\n- `确认风险`\n- `误报`",
  ],
  checklist: [
    "已读取实际 diff 与检查清单",
    "阻断项和建议项已分开",
    "每个阻断项都给出文件位置与具体风险",
    "已提示用户三选一处理方式",
    "结论明确为 `CLEAR TO LAND` 或 `BLOCKED`",
    "没把普通代码风格问题误报成阻断项",
  ],
  relatedSkills: [
    {
      get id() {
        return testingStrategySkill.id;
      },
      reason: "需要与 `testing-strategy` 配合，决定哪些风险必须补测后才能放行。",
    },
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
      id: "collect-diff",
      entry: new URL("./scripts/collect_diff.mjs", import.meta.url),
      target: "scripts/collect_diff.mjs",
      runtime: "node",
      bundle: false,
      description: "Script collect_diff.mjs.",
    }),
    defineSkillScript({
      id: "render-report",
      entry: new URL("./scripts/render_report.mjs", import.meta.url),
      target: "scripts/render_report.mjs",
      runtime: "node",
      bundle: false,
      description: "Script render_report.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "checklist",
      source: new URL("./references/checklist.md", import.meta.url),
      target: "references/checklist.md",
      title: "checklist.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scripts-workflow",
      source: new URL("./references/scripts-workflow.md", import.meta.url),
      target: "references/scripts-workflow.md",
      title: "scripts-workflow.md",
      summary: "Reference material for pre-landing-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
