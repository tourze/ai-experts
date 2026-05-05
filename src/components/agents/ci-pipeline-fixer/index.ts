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
