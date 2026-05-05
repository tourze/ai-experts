import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const svnWorkflowSkill = defineSkill({
  id: "svn-workflow",
  fullName: "SVN 工作流",
  description: "当用户要执行 SVN 日常操作、管理分支标签、处理合并冲突、配置属性、维护仓库或做 SVN 到 Git 迁移时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "properties-and-admin",
      source: new URL("./references/properties-and-admin.md", import.meta.url),
      target: "references/properties-and-admin.md",
      title: "properties-and-admin.md",
      summary: "Reference material for svn-workflow.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for svn-workflow.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
