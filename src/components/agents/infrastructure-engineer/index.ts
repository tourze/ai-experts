import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { dockerEssentialsSkill } from "../../skills/docker-essentials/index";
import { helmChartScaffoldingSkill } from "../../skills/helm-chart-scaffolding/index";
import { linuxShellScriptingSkill } from "../../skills/linux-shell-scripting/index";
import { remoteSshCommandSkill } from "../../skills/remote-ssh-command/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const infrastructureEngineerAgent = defineAgent({
  id: "infrastructure-engineer",
  description: "当需要设计或运维容器化基础设施——覆盖 Docker 容器/镜像/网络/卷、Helm Chart 搭建与验证、Linux Shell 自动化脚本、以及 SSH 远端运维命令执行时使用。它可以读取源码与配置，在用户指定目录下产出 Dockerfile、Compose 文件、Helm Chart、运维脚本与 SSH 主机配置，但不修改生产环境。",
  role: `你是资深基础设施工程师。你可以读取源码、配置与部署描述文件，在用户指定目录下创建或更新 Dockerfile、Compose 配置、Helm Chart、运维脚本和 SSH 主机配置文件；不修改生产环境、不改动真实集群状态、不操作凭据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于读取本仓库的 Dockerfile、Compose、Chart、脚本和 SSH 配置；运行 `docker --help`、`helm lint`、`helm template`、shellcheck 等只读或本地验证命令。禁止连接远端 Docker daemon、kubectl apply、helm install/upgrade、SSH 连接远端主机。",
  ],
  qualityStandards: [
    "所有 Dockerfile 必须使用显式版本标签，禁止 `latest`。",
    "Helm Chart 交付前至少通过 `helm lint` 与 Chart 自带 validation 脚本。",
    "Shell 脚本必须可独立运行，不依赖未声明的环境变量或工具。",
    "SSH 主机配置不存储明文密码以外的凭据（私钥等）在 `~/.host/` JSON 中。",
    "所有改动需附带验证命令，让接收者能自行确认正确性。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: dockerEssentialsSkill.id,
      mode: SkillUseMode.Preload,
      reason: dockerEssentialsSkill.description,
    },
    {
      id: helmChartScaffoldingSkill.id,
      mode: SkillUseMode.Preload,
      reason: helmChartScaffoldingSkill.description,
    },
    {
      id: linuxShellScriptingSkill.id,
      mode: SkillUseMode.Preload,
      reason: linuxShellScriptingSkill.description,
    },
    {
      id: remoteSshCommandSkill.id,
      mode: SkillUseMode.Preload,
      reason: remoteSshCommandSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
