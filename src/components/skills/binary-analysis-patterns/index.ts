import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先识别文件格式、架构、位数、编译器痕迹、入口点和导入导出表。",
      "用字符串、交叉引用、反汇编和反编译结果建立候选业务函数清单。",
      "对关键分支回到汇编验证，避免把伪代码、编译器模板或初始化噪声当作事实。",
      "遇到结构体、符号恢复或反逆向保护时读取对应 reference；常用初筛命令读取 `triage-commands`。",
      "协议编解码或加密路径不清晰时，把流量或帧样本交给 `protocol-reverse-engineering` 交叉验证。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "文件格式、架构、入口点、导入表、关键字符串和候选函数清单。",
      "函数 / 偏移 / 字符串级证据链，区分已确认和待动态验证结论。",
      "结构恢复、符号恢复、反逆向保护或协议路径的后续分析建议。",
    ],
  }),
  references: [
    defineReference({
      id: "triage-commands",
      source: new URL("./references/triage-commands.md", import.meta.url),
      target: "references/triage-commands.md",
      title: "二进制初筛命令",
      summary: "file、strings、objdump/readelf/otool/rizin 等静态初筛命令和适用场景。",
      loadWhen: "需要快速确认二进制格式、架构、字符串、导入表或入口点时读取。",
    }),
    defineReference({
      id: "anti-reversing-techniques",
      source: new URL("./references/anti-reversing-techniques.md", import.meta.url),
      target: "references/anti-reversing-techniques.md",
      title: "anti-reversing-techniques.md",
      summary: "反逆向技术分析：代码混淆、反调试、校验和与自修改代码绕过方法。",
      loadWhen: "需要分析二进制中的保护逻辑或反逆向技术时读取。",
    }),
    defineReference({
      id: "struct-recovery",
      source: new URL("./references/struct-recovery.md", import.meta.url),
      target: "references/struct-recovery.md",
      title: "struct-recovery.md",
      summary: "二进制数据结构恢复方法与模式：从汇编识别结构体字段布局。",
      loadWhen: "需要从二进制中恢复 C 结构体布局或识别数据结构时读取。",
    }),
    defineReference({
      id: "symbol-recovery",
      source: new URL("./references/symbol-recovery.md", import.meta.url),
      target: "references/symbol-recovery.md",
      title: "symbol-recovery.md",
      summary: "符号恢复技术：函数名识别、导入导出表分析与类型信息重建。",
      loadWhen: "需要恢复 stripped 二进制中的符号或重建函数签名时读取。",
    }),
  ],
});
