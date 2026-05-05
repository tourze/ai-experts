import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { protocolReverseEngineeringSkill } from "../protocol-reverse-engineering/index";

export const binaryAnalysisPatternsSkill = defineSkill({
  id: "binary-analysis-patterns",
  fullName: "二进制分析模式",
  description: "当需要对可执行文件、库或固件组件做静态反汇编、反编译、符号恢复、结构恢复和反逆向技术分析时使用。",
  useCases: [
    "需要理解入口点、导入表、字符串、控制流和数据结构。",
    "需要和 [anti-reversing-techniques](references/anti-reversing-techniques.md) 联动分析保护逻辑。",
    "协议编解码或加密路径不清晰时，可切到 `protocol-reverse-engineering`。",
  ],
  constraints: [
    "先识别架构、位数、ABI 和编译器痕迹，再选工具链。",
    "反编译结果只是假说，必须回到汇编和交叉引用确认。",
    "把初始化/框架噪声与业务逻辑拆开。",
    "所有关键结论都要标明函数、偏移或字符串证据。",
  ],
  checklist: [
    "确认入口点、异常处理、导入表和关键字符串。",
    "标出可疑分发函数、解密函数和状态机边界。",
    "对关键分支同时看伪代码和汇编。",
    "记录哪些函数已经确认，哪些仍需动态验证。",
  ],
  relatedSkills: [
    {
      get id() {
        return protocolReverseEngineeringSkill.id;
      },
      reason: "协议编解码或加密路径不清晰时，可切到 `protocol-reverse-engineering`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只信伪代码",
      pass: "关键分支回看汇编",
    }),
    defineAntiPattern({
      fail: "编译器模板当业务",
      pass: "先识别工具链",
    }),
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
