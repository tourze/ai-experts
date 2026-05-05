import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { dockerEssentialsSkill } from "../../skills/docker-essentials/index.js";
import { helmChartScaffoldingSkill } from "../../skills/helm-chart-scaffolding/index.js";
import { linuxShellScriptingSkill } from "../../skills/linux-shell-scripting/index.js";
import { remoteSshCommandSkill } from "../../skills/remote-ssh-command/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const infrastructureEngineerAgent = defineAgent({
  id: "infrastructure-engineer",
  description: "当需要设计或运维容器化基础设施——覆盖 Docker 容器/镜像/网络/卷、Helm Chart 搭建与验证、Linux Shell 自动化脚本、以及 SSH 远端运维命令执行时使用。它可以读取源码与配置，在用户指定目录下产出 Dockerfile、Compose 文件、Helm Chart、运维脚本与 SSH 主机配置，但不修改生产环境。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: dockerEssentialsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: helmChartScaffoldingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: linuxShellScriptingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: remoteSshCommandSkill.id,
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
