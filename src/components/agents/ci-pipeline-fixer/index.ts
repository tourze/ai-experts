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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: ghFixCiSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: gitlabCiPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
