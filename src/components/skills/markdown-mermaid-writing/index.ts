import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { mdToPdfSkill } from "../md-to-pdf/index";

export const markdownMermaidWritingSkill = defineSkill({
  id: "markdown-mermaid-writing",
  fullName: "Markdown 与 Mermaid 写作",
  description: "当用户要用 Markdown 和 Mermaid 产出报告、技术文档、研究材料、决策记录或图表型说明时使用。该技能把文本化文档和文本化图示作为默认交付标准。",
  useCases: [
    "需要用纯文本格式维护文档，并希望图表可审阅、可 diff、可版本管理。",
    "用户要写技术方案、研究报告、状态汇报、PR 描述、决策记录或展示稿。",
    "文档中需要流程图、时序图、状态图、甘特图、ER 图等 Mermaid 图示。",
    "若不仅要源码，还要主题化 SVG 或终端 ASCII 成品图，继续使用 [pretty-mermaid](references/pretty-mermaid.md)。",
    "若最终要导出 PDF，可继续使用 `md-to-pdf`。",
  ],
  constraints: [
    "先确定文档类型，再选模板和图表；不要先画图后找地方塞进去。",
    "Markdown 与 Mermaid 都要走已有样式规范，避免同仓库里出现多套写法。",
    "图要服务于结论，不要为了“好看”而堆无效形状。",
    "复杂主题先拆成多个小图，不要把所有逻辑塞进一张图。",
  ],
  checklist: [
    "是否先选好了模板，而不是每次从空白页开始。",
    "是否读取了对应的样式指南，保证标题、列表、图表命名一致。",
    "图表是否真正回答了读者问题，而不是只是把文字搬成方框。",
    "交付前是否检查了 Mermaid 代码块的语法与节点命名。",
  ],
  relatedSkills: [
    {
      get id() {
        return mdToPdfSkill.id;
      },
      reason: "若最终要导出 PDF，可继续使用 `md-to-pdf`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "一张图塞所有逻辑：15+ 节点一张图，读者无法聚焦任何环节。",
      pass: "按主题拆成小图",
    }),
    defineAntiPattern({
      fail: "用截图代替源码",
      pass: "文本化 Mermaid：flowchart TD Client --> Gateway --> Service --> DB",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "diagrams",
      source: new URL("./references/diagrams/", import.meta.url),
      target: "references/diagrams",
      title: "diagrams",
      summary: "Mermaid 图表示例集合，包括流程图、时序图、状态图、甘特图等常见图示模板。",
      loadWhen: "需要参考常见图表的 Mermaid 代码写法或选择合适的图类型时读取。",
    }),
    defineReference({
      id: "markdown-style-guide",
      source: new URL("./references/markdown_style_guide.md", import.meta.url),
      target: "references/markdown_style_guide.md",
      title: "markdown_style_guide.md",
      summary: "Markdown 写作的样式规范，包括标题层级、列表格式、链接引用、表格和代码块的统一写法。",
      loadWhen: "需要维护 Markdown 文档风格一致性或确定写作规范时读取。",
    }),
    defineReference({
      id: "mermaid-style-guide",
      source: new URL("./references/mermaid_style_guide.md", import.meta.url),
      target: "references/mermaid_style_guide.md",
      title: "mermaid_style_guide.md",
      summary: "Mermaid 图表的样式规范，涵盖节点命名、颜色主题、布局方向和可读性约束。",
      loadWhen: "需要确保 Mermaid 图表风格一致、节点命名规范时读取。",
    }),
    defineReference({
      id: "pretty-mermaid",
      source: new URL("./references/pretty-mermaid.md", import.meta.url),
      target: "references/pretty-mermaid.md",
      title: "pretty-mermaid.md",
      summary: "将 Mermaid 源码渲染为主题化 SVG 或终端 ASCII 图的方案说明。",
      loadWhen: "需要将 Mermaid 图表输出为漂亮的 SVG 图片或终端兼容格式时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "examples",
      source: new URL("./assets/examples/", import.meta.url),
      target: "assets/examples",
    })
  ],
});
