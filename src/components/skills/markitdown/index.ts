import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { procedureUse, markitdownBatchConvert, markitdownConvertLiterature, markitdownConvertWithAi, markitdownMarkitdownRuntime } from "../../scripts/index";

import { docCoauthoringSkill } from "../doc-coauthoring/index";
import { mdToPdfSkill } from "../md-to-pdf/index";
import { pptGenerateSkill } from "../ppt-generate/index";

export const markitdownSkill = defineSkill({
  id: "markitdown",
  fullName: "MarkItDown",
  description: "当用户要用 MarkItDown 把 Office、图片、HTML、音频或其他源文件抽取成 .md 文本时使用，适合批量转换和 AI 图片描述增强。",
  useCases: [
    "目标是把多种格式统一转成 Markdown，供总结、检索、二次写作或知识库沉淀。",
    "用户需要批量处理目录，而不是只转换单个文件。",
    "用户要处理学术论文或文献库，并生成目录索引、元数据清单。",
    "当用户只处理单个 Office 文件且最终仍要保留原格式时，优先使用 `docx`、`pptx` 或 `xlsx`。",
  ],
  constraints: [
    "先确认输出真的是 Markdown；如果最终要的是原格式回写，不要误用。",
    "AI 增强模式依赖 `openai` 兼容客户端与 API key，只在确实需要图片理解时开启。",
    "批量转换时保留原目录结构与文件扩展映射，避免输出目录混乱。",
    "学术文献场景下优先补齐文件命名和元数据，再做批量转换。",
  ],
  checklist: [
    "是否确认了输入目录、输出目录、扩展名过滤和递归策略。",
    "是否在批量模式下保留了原文件名与层级，便于回溯原件。",
    "AI 模式是否只在有图像理解需求时启用，并明确模型与密钥来源。",
    "对学术文献是否输出了 `INDEX.md` 或 `catalog.json` 这类导航文件。",
  ],
  relatedSkills: [
    {
      get id() {
        return docCoauthoringSkill.id;
      },
      label: "docx",
      reason: "当用户只处理单个 Office 文件且最终仍要保留原格式时，优先使用 `docx`、`pptx` 或 `xlsx`。",
    },
    {
      get id() {
        return pptGenerateSkill.id;
      },
      label: "pptx",
      reason: "当用户只处理单个 Office 文件且最终仍要保留原格式时，优先使用 `docx`、`pptx` 或 `xlsx`。",
    },
    {
      get id() {
        return docCoauthoringSkill.id;
      },
      label: "xlsx",
      reason: "当用户只处理单个 Office 文件且最终仍要保留原格式时，优先使用 `docx`、`pptx` 或 `xlsx`。",
    },
    {
      get id() {
        return mdToPdfSkill.id;
      },
      reason: "后续若还要导出 PDF，可转给 `md-to-pdf`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "输出覆盖原件",
      pass: "输出独立目录",
    }),
    defineAntiPattern({
      fail: "不加扩展过滤",
      pass: "显式扩展",
    }),
    defineAntiPattern({
      fail: "转完不抽查",
      pass: "关键页抽样",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  procedures: [
    procedureUse(markitdownBatchConvert.id),
    procedureUse(markitdownConvertLiterature.id),
    procedureUse(markitdownConvertWithAi.id),
    procedureUse(markitdownMarkitdownRuntime.id),
  ],
  references: [
    defineReference({
      id: "api-reference",
      source: new URL("./references/api_reference.md", import.meta.url),
      target: "references/api_reference.md",
      title: "api_reference.md",
      summary: "MarkItDown 的 API 接口文档，包括 CLI 参数、配置选项和调用示例。",
      loadWhen: "需要查阅 MarkItDown 的具体命令行参数、配置选项或 API 使用方式时读取。",
    }),
    defineReference({
      id: "file-formats",
      source: new URL("./references/file_formats.md", import.meta.url),
      target: "references/file_formats.md",
      title: "file_formats.md",
      summary: "MarkItDown 支持的输入文件格式说明、限制条件和格式转换的最佳实践。",
      loadWhen: "需要确认 MarkItDown 对特定文件格式的支持情况或处理格式转换异常时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "example-usage",
      source: new URL("./assets/example_usage.md", import.meta.url),
      target: "assets/example_usage.md",
    })
  ],
});
