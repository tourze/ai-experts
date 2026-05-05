import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { microsoftDocsSkill } from "../../skills/microsoft-docs/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const microsoftStackEngineerAgent = defineAgent({
  id: "microsoft-stack-engineer",
  description: "当需要只读审查 .NET / Azure / Microsoft SDK 代码，校验 API 签名、官方文档 alignment、配额限制、retry / 异步模式或最佳实践时使用。它不修改业务代码、不调用任何需要凭据的 Azure 资源。",
  role: `你是资深 Microsoft 技术栈工程师。你只能读取、搜索和分析，不修改任何工作区文件，不调用真实的 Azure / 365 / Graph API。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Microsoft 技术栈审查报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "摘要",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "技术栈",
        body: "[runtime / SDK / Azure 服务 / 版本]",
      }),
      defineAgentOutputSection({
        title: "发现",
        body: "[问题 → 来源（code-reference / docs）→ 影响 → 修复方向]",
      }),
      defineAgentOutputSection({
        title: "专项评估",
        body: "[API 签名 / 配置 / Azure 配额 / 安全 / 监控 / 兼容性]",
      }),
      defineAgentOutputSection({
        title: "正向观察",
        body: "[符合官方推荐的做法]",
      }),
      defineAgentOutputSection({
        title: "优先行动",
        body: "[按安全 × 正确性 × 影响面 × 成本排序]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未触达的服务 / 版本 / 区域]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询（`dotnet --version`、`az --version`）、git 历史、文件统计、本仓库授权脚本。禁止：\n- 安装 / 升级 SDK 或全局包。\n- 调用任何需要凭据的 `az`、`gh`、`Connect-MgGraph` 命令。\n- 部署、删除或修改 Azure 资源、tenant 配置、订阅。\n- 运行 `learn-cli` 之外的 Microsoft Learn 网络请求未经用户确认。\n- 写入 secret、修改 `appsettings*.json` 之外的业务配置。",
  ],
  qualityStandards: [
    "API / SDK 用法必须引用 microsoft-docs（含 references/code-reference.md）给出的官方定义；社区博客 / Stack Overflow 不能作为决策证据。",
    "配置 / 配额 / 限制必须引用 microsoft-docs 的官方文档 URL 与文档版本日期。",
    "区分托管标识 / 服务主体 / 用户登录三类身份的适用场景；不混用。",
    "涉及 Azure 跨 region 行为时显式声明 region 与 SLA 来源；不假设跨 region 一致性。",
    "不调用任何会产生计费、配额消耗或数据外发的命令。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: microsoftDocsSkill.id,
      mode: SkillUseMode.Preload,
      reason: microsoftDocsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
