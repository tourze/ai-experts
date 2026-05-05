import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const pdfSkill = defineSkill({
  id: "pdf",
  fullName: "PDF",
  description: "当用户要读取、填写表单、批注、分析结构或转换 PDF 文件时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "check-bounding-boxes",
      entry: new URL("./scripts/check_bounding_boxes.mjs", import.meta.url),
      target: "scripts/check_bounding_boxes.mjs",
      runtime: "node",
      bundle: false,
      description: "Script check_bounding_boxes.mjs.",
    }),
    defineSkillScript({
      id: "check-fillable-fields",
      entry: new URL("./scripts/check_fillable_fields.mjs", import.meta.url),
      target: "scripts/check_fillable_fields.mjs",
      runtime: "node",
      bundle: false,
      description: "Script check_fillable_fields.mjs.",
    }),
    defineSkillScript({
      id: "convert-pdf-to-images",
      entry: new URL("./scripts/convert_pdf_to_images.py", import.meta.url),
      target: "scripts/convert_pdf_to_images.py",
      runtime: "python3",
      bundle: false,
      description: "Script convert_pdf_to_images.py.",
    }),
    defineSkillScript({
      id: "create-validation-image",
      entry: new URL("./scripts/create_validation_image.py", import.meta.url),
      target: "scripts/create_validation_image.py",
      runtime: "python3",
      bundle: false,
      description: "Script create_validation_image.py.",
    }),
    defineSkillScript({
      id: "extract-form-field-info",
      entry: new URL("./scripts/extract_form_field_info.py", import.meta.url),
      target: "scripts/extract_form_field_info.py",
      runtime: "python3",
      bundle: false,
      description: "Script extract_form_field_info.py.",
    }),
    defineSkillScript({
      id: "extract-form-structure",
      entry: new URL("./scripts/extract_form_structure.py", import.meta.url),
      target: "scripts/extract_form_structure.py",
      runtime: "python3",
      bundle: false,
      description: "Script extract_form_structure.py.",
    }),
    defineSkillScript({
      id: "fill-fillable-fields",
      entry: new URL("./scripts/fill_fillable_fields.py", import.meta.url),
      target: "scripts/fill_fillable_fields.py",
      runtime: "python3",
      bundle: false,
      description: "Script fill_fillable_fields.py.",
    }),
    defineSkillScript({
      id: "fill-pdf-form-with-annotations",
      entry: new URL("./scripts/fill_pdf_form_with_annotations.py", import.meta.url),
      target: "scripts/fill_pdf_form_with_annotations.py",
      runtime: "python3",
      bundle: false,
      description: "Script fill_pdf_form_with_annotations.py.",
    })
  ],
  references: [
    defineReference({
      id: "pdf-extraction",
      source: new URL("./references/pdf-extraction.md", import.meta.url),
      target: "references/pdf-extraction.md",
      title: "pdf-extraction.md",
      summary: "Reference material for pdf.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pdf.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
