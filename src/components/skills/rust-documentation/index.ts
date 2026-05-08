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
import { rustOwnershipIdiomsSkill } from "../rust-ownership-idioms/index";
import { rustTestingSkill } from "../rust-testing/index";

export const rustDocumentationSkill = defineSkill({
  id: "rust-documentation",
  fullName: "Rust 文档规范",
  description: "当用户要编写 Rust 公共 API 文档、配置 rustdoc lint、区分注释与文档、或补齐 Safety/Errors/Panics 段落时使用。",
  useCases: [
    "为公共 API 编写 `///` 文档。",
    "区分注释（`//` 解释 why）和文档（`///` 解释 what/how）。",
    "补齐 `# Safety`、`# Errors`、`# Panics`、`# Examples` 段落。",
    "配置 `#![warn(missing_docs)]` 或 `rustdoc` lint。",
  ],
  constraints: [
    "注释只解释\"为什么\"；代码应该自解释\"是什么\"。",
    "`///` 文档解释\"做什么、怎么用、失败条件\"。",
    "公共函数必须有文档；`# Errors` 列出返回 `Err` 的条件。",
    "`unsafe fn` 必须有 `# Safety` 段落说明调用方需满足的前置条件。",
    "可能 panic 的函数必须有 `# Panics` 段落。",
    "`# Examples` 中的代码块是可执行的文档测试——必须能编译通过。",
    "用 `//!` 写模块级文档，放在文件顶部。",
  ],
  checklist: [
    "公共 API 是否都有 `///` 文档？",
    "返回 `Result` 的函数是否有 `# Errors`？",
    "`unsafe fn` 是否有 `# Safety`？",
    "注释是否在解释\"为什么\"而不是翻译代码？",
  ],
  relatedSkills: [
    {
      get id() {
        return rustTestingSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-testing`。",
    },
    {
      get id() {
        return rustOwnershipIdiomsSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-testing`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "注释翻译代码",
      pass: "注释解释 why",
    }),
    defineAntiPattern({
      fail: "空泛的 # Safety",
      pass: "列出具体不变量",
    }),
    defineAntiPattern({
      fail: "缺 # Errors",
      pass: "列出错误条件",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先区分注释、公共 API 文档和模块级 `//!` 文档的职责。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "为公共函数补齐摘要、Examples、Errors、Panics 和 unsafe Safety 不变量。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "确保示例代码可作为文档测试编译，注释只解释 why，不翻译代码。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "段落速查读取 `doc-section-guide`，详细 rustdoc 规范读取 `chapter-08`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "需要补齐的公共 API 文档、模块文档和 rustdoc lint 设置。",
      "Safety / Errors / Panics / Examples 段落清单和具体缺口。",
      "文档测试风险、注释职责偏差和后续测试建议。",
    ],
  }),
  references: [
    defineReference({
      id: "doc-section-guide",
      source: new URL("./references/doc-section-guide.md", import.meta.url),
      target: "references/doc-section-guide.md",
      title: "Rust 文档段落速查",
      summary: "摘要、Examples、Errors、Panics、Safety 等 rustdoc 段落的使用时机和内容要求。",
      loadWhen: "需要快速判断 Rust 公共 API 文档应补哪些段落时读取。",
    }),
    defineReference({
      id: "chapter-08",
      source: new URL("./references/chapter_08.md", import.meta.url),
      target: "references/chapter_08.md",
      title: "chapter_08.md",
      summary: "rustdoc 文档段落（Safety/Errors/Panics/Examples）的编写规范与公共 API 文档最佳实践。",
      loadWhen: "需要编写或审查 Rust 公共 API 文档、补齐 # Safety/# Errors 段落时读取。",
    }),
  ],
});
