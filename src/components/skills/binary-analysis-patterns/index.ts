import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const binaryAnalysisPatternsSkill = defineSkill({
  id: "binary-analysis-patterns",
  fullName: "二进制分析模式",
  description: "当需要对可执行文件、库或固件组件做静态反汇编、反编译、符号恢复、结构恢复和反逆向技术分析时使用。",
  useCases: [
    "需要理解入口点、导入表、字符串、控制流和数据结构。",
    "需要和 [anti-reversing-techniques](references/anti-reversing-techniques.md) 联动分析保护逻辑。",
    "协议编解码或加密路径不清晰时，可切到 [protocol-reverse-engineering](../protocol-reverse-engineering/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-reversing-techniques",
      source: new URL("./references/anti-reversing-techniques.md", import.meta.url),
      target: "references/anti-reversing-techniques.md",
      title: "anti-reversing-techniques.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "struct-recovery",
      source: new URL("./references/struct-recovery.md", import.meta.url),
      target: "references/struct-recovery.md",
      title: "struct-recovery.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "symbol-recovery",
      source: new URL("./references/symbol-recovery.md", import.meta.url),
      target: "references/symbol-recovery.md",
      title: "symbol-recovery.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
