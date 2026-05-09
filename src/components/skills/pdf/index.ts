import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, pdfCheckBoundingBoxes, pdfCheckFillableFields, pdfConvertPdfToImages, pdfCreateValidationImage, pdfExtractFormFieldInfo, pdfExtractFormStructure, pdfFillFillableFields, pdfFillPdfFormWithAnnotations } from "../../procedures/index";

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
    "默认不会覆盖已存在的 PDF、JSON 或 PNG 输出；确认目标文件可替换后才传 `--overwrite`。",
  ],
  checklist: [
    "是否区分了可填写表单与视觉型表单。",
    "是否先提取字段信息，再让用户或上游流程生成字段值 JSON。",
    "对复选框、单选组、下拉框是否检查了合法取值，而不是直接塞文本。",
    "若走视觉型写入，是否结合标注图或页面截图做了位置核验。",
    "只需抽取文本/表格时，是否切换到 [pdf-extraction](references/pdf-extraction.md)。",
    "是否确认输出路径不存在，或已得到明确覆盖许可后再使用 `--overwrite`。",
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
  platforms: [Platform.Claude],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断任务是纯抽取、可填写表单、视觉型表单写入、坐标校验还是 PDF 转图片。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "可填写表单先运行字段/结构发现 procedure，确认字段 ID、页码、合法值和字段类型。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "视觉型 PDF 先渲染或创建标注图，再按 bounding boxes / 抽样核验坐标，不能凭感觉填。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "表单链路读取 `forms` 和 `runtime-reference`；纯抽取任务读取 `pdf-extraction`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "PDF 类型判断、字段结构、页码、合法取值或视觉坐标证据。",
      "填写/批注/转换 procedure 选择、参数来源和生成文件路径。",
      "关键字段抽样检查、错位/字体/坐标风险和人工复核要求。",
    ],
  }),
  procedures: [
    procedureUse(pdfCheckBoundingBoxes, {
      label: "Bounding box 校验",
      when: "需要检查视觉型 PDF 表单的标签框和录入框是否重叠或高度不足时。",
      reason: "自动检测相交矩形和高度不足的问题，避免字段错位。",
    }),
    procedureUse(pdfCheckFillableFields, {
      label: "可填写字段检测",
      when: "需要快速判断 PDF 是否包含可填写 AcroForm 字段时。",
      reason: "区分可填写表单与视觉型表单，决定后续使用哪条处理链路。",
    }),
    procedureUse(pdfConvertPdfToImages, {
      label: "PDF 转图片",
      when: "需要将 PDF 各页渲染为 PNG 图片用于验证或标注时。",
      reason: "自动缩放以适应页面尺寸，避免手写 PDF 渲染代码。",
    }),
    procedureUse(pdfCreateValidationImage, {
      label: "校验图生成",
      when: "需要在页面图片上叠加 bounding box 框线进行人工校验时。",
      reason: "可视化字段位置，红色标注录入框、蓝色标注标签框。",
    }),
    procedureUse(pdfExtractFormFieldInfo, {
      label: "表单字段提取",
      when: "需要提取可填写 PDF 表单的字段类型、页码、位置和选项值时。",
      reason: "自动识别文本框、复选框、单选组和下拉框的详细信息。",
    }),
    procedureUse(pdfExtractFormStructure, {
      label: "视觉表单结构提取",
      when: "需要分析视觉型 PDF 表单的文本标签、水平分隔线和复选框布局时。",
      reason: "使用 pdfjs-dist 解析绘制命令，提取语义结构的行边界。",
    }),
    procedureUse(pdfFillFillableFields, {
      label: "可填写表单回填",
      when: "需要根据 JSON 字段值自动填写 PDF 可填写表单时。",
      reason: "支持文本框、复选框、单选组和下拉框，自动校验合法取值。",
    }),
    procedureUse(pdfFillPdfFormWithAnnotations, {
      label: "视觉表单批注写入",
      when: "需要在视觉型 PDF 表单上根据 bounding box 坐标写入文本内容时。",
      reason: "按坐标框精确定位，支持自定义字体大小和颜色。",
    }),
  ],
  references: [
    defineReference({
      id: "forms",
      source: new URL("./references/forms.md", import.meta.url),
      target: "references/forms.md",
      title: "PDF 表单处理指南",
      summary: "PDF 可填写表单与视觉表单的字段发现、填写、批注和校验流程。",
      loadWhen: "需要填写、标注或校验 PDF 表单时读取。",
    }),
    defineReference({
      id: "runtime-reference",
      source: new URL("./references/reference.md", import.meta.url),
      target: "references/reference.md",
      title: "PDF procedure 运行参考",
      summary: "PDF 处理脚本/procedure 的参数、坐标、字段结构和运行注意事项。",
      loadWhen: "需要确认 PDF procedure 具体参数、字段结构或坐标处理细节时读取。",
    }),
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
