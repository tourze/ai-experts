import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";

export const pdfSkill = defineSkill({
  id: "pdf",
  fullName: "PDF",
  description: "当用户要读取、填写表单、批注、分析结构或转换 PDF 文件时使用。",
  useCases: [
    "用户要处理 `.pdf` 文件本身，而不是只抽文本。",
    "需要判断 PDF 是否可填写、提取字段信息、按 JSON 回填、或通过注释方式写入内容。",
    "需要把 PDF 渲染成图片，或根据坐标/框选信息做人工校验。",
    "纯抽取场景优先看 [pdf-extraction](references/pdf-extraction.md)。",
  ],
  constraints: [
    "先判断是“可填写表单”还是“视觉表单”，两条链路不要混用。",
    "填表前必须先跑字段发现脚本，确认字段 ID、页码和合法值。",
    "视觉型 PDF 的写入坐标要经过图片标注或抽样核对，不能凭感觉填。",
    "PDF 写回后至少人工检查一页关键字段，避免字段错位或字体异常。",
  ],
  checklist: [
    "是否区分了可填写表单与视觉型表单。",
    "是否先提取字段信息，再让用户或上游流程生成字段值 JSON。",
    "对复选框、单选组、下拉框是否检查了合法取值，而不是直接塞文本。",
    "若走视觉型写入，是否结合标注图或页面截图做了位置核验。",
    "只需抽取文本/表格时，是否切换到 [pdf-extraction](references/pdf-extraction.md)。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不探测字段直接填",
      pass: "extract → fill",
    }),
    defineAntiPattern({
      fail: "视觉型当填写型",
      pass: "走标注路径",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("pdf-check-bounding-boxes"),
    scriptUse("pdf-check-fillable-fields"),
    scriptUse("pdf-convert-pdf-to-images"),
    scriptUse("pdf-create-validation-image"),
    scriptUse("pdf-extract-form-field-info"),
    scriptUse("pdf-extract-form-structure"),
    scriptUse("pdf-fill-fillable-fields"),
    scriptUse("pdf-fill-pdf-form-with-annotations"),
  ],
  references: [
    defineReference({
      id: "pdf-extraction",
      source: new URL("./references/pdf-extraction.md", import.meta.url),
      target: "references/pdf-extraction.md",
      title: "pdf-extraction.md",
      summary: "PDF 纯文本提取的方案和工具对比，适用于只需抽取文字内容的场景。",
      loadWhen: "只需从 PDF 中提取文本或表格内容，不需要处理表单填写或标注时读取。",
    }),
  ],
});
