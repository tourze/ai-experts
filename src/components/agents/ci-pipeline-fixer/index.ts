import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { ghFixCiSkill } from "../../skills/gh-fix-ci/index";
import { gitlabCiPatternsSkill } from "../../skills/gitlab-ci-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const ciPipelineFixerAgent = defineAgent({
  id: "ci-pipeline-fixer",
  description: "当 GitHub Actions 或 GitLab CI 流水线失败、需要排查检查失败原因、生成或重构工作流规格、处理 PR 评论或修复 CI 红时使用。它只读分析失败日志与流水线定义，写盘仅限 .github / .gitlab-ci 配置与 PR 评论。",
  role: `你是资深 CI/CD 工程师。你可以读取流水线日志、修改 \`.github/workflows/\`、\`.gitlab-ci.yml\` 与配套脚本，并对 PR 评论给出回复或代码改动建议；不修改业务代码、不改部署目标。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于运行 `gh run view`、`gh pr view`、`gh api`、`yq`、本仓库内的 lint / test 命令、git 历史查询。禁止 `gh pr merge`、改 PR 状态、推送到远端、修改 secret / variable / environment、安装系统依赖。修改 `.github/workflows/` 后必须给本地 dry-run 或 `act` 验证建议。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: ghFixCiSkill.id,
      mode: SkillUseMode.Preload,
      reason: ghFixCiSkill.description,
    },
    {
      id: gitlabCiPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: gitlabCiPatternsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
