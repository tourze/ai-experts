import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  checklist: [
    "`svn status` 中只包含当前任务相关文件，没有顺手带上的其他改动。",
    "提交命令包含显式路径，提交说明能回答“改了什么、为什么改”。",
    "分支回合并前，目标工作副本已 `svn update`，且没有本地脏改动。",
    "使用 `svn mergeinfo` 时显式写出 `--show-revs=eligible|merged`。",
    "忽略策略是否选对：单目录用 `svn:ignore`，子树继承用 `svn:global-ignores`。",
    "旧环境兼容性是否确认：`svn cleanup --remove-unversioned` 与自动 reintegration 依赖较新客户端。",
    "做 SVN→Git 迁移前已准备 `authors.txt`，并确认 `trunk/branches/tags` 路径名与仓库真实布局一致。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "svn add . + 模糊提交",
      pass: "显式路径 + 信息",
    }),
    defineAntiPattern({
      fail: "直接改 tags/",
      pass: "新建 hotfix tag",
    }),
    defineAntiPattern({
      fail: "脏工作副本合并",
      pass: "干净副本 + update",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "日常提交先 `svn update`、`svn status -u`、`svn diff <path>`，只提交当前任务显式路径。",
      "创建分支或标签用 `svn copy <trunk-url> <branches-or-tags-url> -m ...`；`tags/` 只做发布快照。",
      "工作副本切换用 `svn switch <branch-url>` 后 `svn info` 核对目标路径。",
      "挑单个修订用 `svn merge -c <rev> <source-url>`；整分支回合并到 trunk 前先更新干净 trunk 工作副本。",
      "查询合并状态显式使用 `svn mergeinfo --show-revs=eligible|merged <source-url> .`。",
      "属性、仓库 hotcopy/dump/load、cleanup 和 SVN→Git 迁移细节读取 properties-and-admin。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "操作计划：工作副本路径、目标 URL、命令、显式提交路径和回滚/冲突处理路径。",
      "合并记录：来源、目标、修订号、mergeinfo 检查、冲突状态和提交说明。",
      "属性/维护/迁移结果：版本兼容性、authors.txt、trunk/branches/tags 映射和后续 Git 整理建议。",
    ],
  }),
  references: [
    defineReference({
      id: "properties-and-admin",
      source: new URL("./references/properties-and-admin.md", import.meta.url),
      target: "references/properties-and-admin.md",
      title: "properties-and-admin.md",
      summary: "SVN 属性配置和仓库管理的详细指南，包含 svn:ignore、eol-style、externals 和仓库备份。",
      loadWhen: "需要配置 SVN 属性或执行仓库管理操作时读取。",
    }),
  ],
});
