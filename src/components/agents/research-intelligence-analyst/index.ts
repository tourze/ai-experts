import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { deepResearchSkill } from "../../skills/deep-research/index";
import { webContentFetcherSkill } from "../../skills/web-content-fetcher/index";
import { comparativeAnalysisSkill } from "../../skills/comparative-analysis/index";
import { researchNoteWrapSkill } from "../../skills/research-note-wrap/index";
import { obsidianBasesSkill } from "../../skills/obsidian-bases/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const researchIntelligenceAnalystAgent = defineAgent({
  id: "research-intelligence-analyst",
  description: "当需要端到端完成外部事实研究、网页正文抓取、多来源对比和研究笔记沉淀时使用。它可以联网检索、读取具体 URL，并在用户指定目录下产出 Markdown 研究报告、来源摘要或 Obsidian 笔记。",
  role: `你是资深研究分析师。你可以搜索外部资料、抓取网页正文、读取用户提供的本地材料，并在用户指定目录下创建或更新 Markdown 研究报告、来源摘要、对比矩阵和 Obsidian 笔记；不修改业务源码、运行配置或非文档资产。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。用户给出具体 URL 时，先用 \`web-content-fetcher\` 抓正文，再进入综合分析。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于读取本地资料、运行本仓库文档脚本、检查 Markdown/Obsidian 文件结构、统计来源清单和 git 历史。禁止安装依赖、抓取需要登录或绕过访问控制的内容、批量下载非公开资料、修改业务源码或生产配置。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: deepResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: deepResearchSkill.description,
    },
    {
      id: webContentFetcherSkill.id,
      mode: SkillUseMode.Preload,
      reason: webContentFetcherSkill.description,
    },
    {
      id: comparativeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: comparativeAnalysisSkill.description,
    },
    {
      id: researchNoteWrapSkill.id,
      mode: SkillUseMode.Preload,
      reason: researchNoteWrapSkill.description,
    },
    {
      id: obsidianBasesSkill.id,
      mode: SkillUseMode.Preload,
      reason: obsidianBasesSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
