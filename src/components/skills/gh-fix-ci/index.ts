import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, ghFixCiInspectPrChecks } from "../../procedures/index";

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
    "procedure 参数必须与实现一致：`--repo`、`--pr`、`--max-lines`、`--context`、`--json`。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 `gh auth status` 成功，并定位目标 PR；用户未给 PR 时从当前分支关联 PR 入手。",
      "优先调用 `gh-fix-ci-inspect-pr-checks` procedure 抽取 failing checks、run id、job id、run URL 和失败片段；外部 provider 只记录 `detailsUrl`。",
      "procedure 不足时用 `gh pr checks <pr> --json ...`、`gh run view <run-id> --json ...` 和 `gh run view <run-id> --log` 手工兜底。",
      "先输出失败上下文与聚焦修复计划，得到用户确认后再修改 workflow 或业务代码；创建或修改 GitHub Actions workflow 前读取 workflow reference。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标 PR、失败检查列表、provider 类型、run/job id、URL 和最小失败日志片段。",
      "日志不可用、检查仍在运行、权限不足或外部 provider 无法展开的说明。",
      "获批前的修复计划，以及获批后对应的代码或 workflow 修改验证结果。",
    ],
  }),
  procedures: [
    procedureUse(ghFixCiInspectPrChecks),
  ],
  references: [
    defineReference({
      id: "create-github-action-workflow-specification",
      source: new URL("./references/create-github-action-workflow-specification.md", import.meta.url),
      target: "references/create-github-action-workflow-specification.md",
      title: "create-github-action-workflow-specification.md",
      summary: "GitHub Actions workflow 语法、触发条件、矩阵策略、环境变量与最佳实践。",
      loadWhen: "需要创建或修改 GitHub Actions workflow 文件时读取。",
    }),
    defineReference({
      id: "gh-address-comments",
      source: new URL("./references/gh-address-comments.md", import.meta.url),
      target: "references/gh-address-comments.md",
      title: "gh-address-comments.md",
      summary: "使用 gh CLI 回复、解析和关闭 PR 评论的工作流示例。",
      loadWhen: "需要自动处理 PR review 评论或批量回复时读取。",
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
