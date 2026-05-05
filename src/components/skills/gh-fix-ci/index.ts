import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const ghFixCiSkill = defineSkill({
  id: "gh-fix-ci",
  fullName: "GitHub Actions CI 排障",
  description: "当用户要求排查或修复 GitHub Actions PR 检查失败时使用；先用 gh 获取失败上下文，再在获批后实施修复。",
  useCases: [
    "当前分支或指定 PR 的 GitHub Actions 检查失败。",
    "需要快速提取失败 job、运行链接和日志片段。",
    "要区分 GitHub Actions 与外部检查提供方。",
  ],
  constraints: [
    "开始前必须确认 `gh auth status` 成功，并且仓库可访问。",
    "仅处理 GitHub Actions；Buildkite 等外部 provider 只报告 `detailsUrl`。",
    "先汇总失败上下文与修复计划，得到用户确认后再改代码。",
    "脚本参数必须与实现一致：`--repo`、`--pr`、`--max-lines`、`--context`、`--json`。",
  ],
  checklist: [
    "是否确认目标 PR 编号，或当前分支是否有关联 PR。",
    "是否列出所有 failing check，并区分 GitHub Actions / 外部 provider。",
    "是否提取 run id、job id、run URL 与最小失败片段。",
    "是否说明日志不可用、仍在运行或需要更高权限的情况。",
    "是否在改代码前给出一份聚焦修复计划。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "凭名字猜失败原因",
      pass: "先抓日志再下结论",
    }),
    defineAntiPattern({
      fail: "直接改不确认",
      pass: "先聚焦修复计划",
    }),
    defineAntiPattern({
      fail: "整段日志砸过去",
      pass: "摘要 + 上下文片段",
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
      id: "inspect-pr-checks",
      entry: new URL("./scripts/inspect_pr_checks.mjs", import.meta.url),
      target: "scripts/inspect_pr_checks.mjs",
      runtime: "node",
      bundle: false,
      description: "Script inspect_pr_checks.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "create-github-action-workflow-specification",
      source: new URL("./references/create-github-action-workflow-specification.md", import.meta.url),
      target: "references/create-github-action-workflow-specification.md",
      title: "create-github-action-workflow-specification.md",
      summary: "Reference material for gh-fix-ci.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gh-address-comments",
      source: new URL("./references/gh-address-comments.md", import.meta.url),
      target: "references/gh-address-comments.md",
      title: "gh-address-comments.md",
      summary: "Reference material for gh-fix-ci.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
  assets: [
    defineAsset({
      id: "github-small",
      source: new URL("./assets/github-small.svg", import.meta.url),
      target: "assets/github-small.svg",
    }),
    defineAsset({
      id: "github",
      source: new URL("./assets/github.png", import.meta.url),
      target: "assets/github.png",
    })
  ],
});
