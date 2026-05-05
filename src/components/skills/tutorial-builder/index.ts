import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tutorialBuilderSkill = defineSkill({
  id: "tutorial-builder",
  description: "当用户要把主题、笔记、URL、论文或仓库材料做成有来源支撑的完整教程、课程讲义或学习包，并需要章节视觉与 DOCX/PDF/HTML 导出规划时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "tutorial-package-contract",
      source: new URL("./references/tutorial-package-contract.md", import.meta.url),
      target: "references/tutorial-package-contract.md",
      title: "tutorial-package-contract.md",
      summary: "Reference material for tutorial-builder.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for tutorial-builder.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
