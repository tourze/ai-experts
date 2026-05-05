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
  useCases: [
    "需要在 SVN 项目中执行 `checkout`、`update`、`status`、`diff`、`commit` 等日常操作。",
    "需要设计或审查 `trunk / branches / tags` 布局、分支命名、标签创建和发布流程。",
    "需要处理 `svn merge`、`svn mergeinfo`、冲突解决、回滚修订与长期分支同步。",
    "需要配置 `svn:ignore`、`svn:global-ignores`、`svn:eol-style`、`svn:externals` 等属性。",
    "需要做仓库管理、热备份、dump/load 或 SVN→Git 迁移；迁移完成后的 Git 历史整理可衔接 `git-advanced-workflows`。",
  ],
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
  ],
});
