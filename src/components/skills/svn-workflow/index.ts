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
  constraints: [
    "提交前先执行 `svn update`，确保基线最新，再处理冲突并复查 `svn diff`。",
    "`svn add` 与 `svn commit` 必须带显式路径；禁止 `svn add .`、`svn add --force`、`svn commit` 无路径提交。",
    "`tags/` 视为只读快照；要修补发布内容，创建新 tag，不直接修改已有 tag。",
    "从 Subversion 1.8 开始，不再推荐旧式 reintegrate 参数；整分支回合并应直接执行 `svn merge ^/branches/<name>`。",
    "查询 mergeinfo 时显式写出 `--show-revs=eligible` 或 `--show-revs=merged`，不要依赖默认输出。",
    "`svn:ignore` 只作用于当前目录；需要对子树统一生效时，优先使用 `svn:global-ignores`（客户端/服务端至少 1.8）。",
    "`svn cleanup --remove-unversioned` 仅在 1.9+ 客户端可用；旧环境只执行 `svn cleanup`，未纳管文件手工清理。",
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
