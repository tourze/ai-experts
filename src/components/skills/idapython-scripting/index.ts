import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";

export const idapythonScriptingSkill = defineSkill({
  id: "idapython-scripting",
  fullName: "IDAPython 脚本参考",
  description: "当需要编写 IDAPython 脚本做函数遍历、交叉引用、字节搜索、Hex-Rays 反编译或 IDALib 批量分析时使用。",
  useCases: [
    "需要在 IDA 中批量重命名、搜索字节模式、遍历函数或基本块。",
    "需要用 Hex-Rays 反编译器 API 读取或修改伪代码。",
    "需要用 IDALib (IDA 9.0+) 做无 GUI 的批量分析。",
    "需要把静态逆向判断批量化为可重复脚本。",
  ],
  constraints: [
    "区分调试态 API (`read_dbg_byte`) 和 IDB 态 API (`get_db_byte`)。",
    "`idc.find_bytes()` 返回 `BADADDR` 时停止循环。",
    "Hex-Rays 反编译结果用 `str(dec)` 转文本，不要直接拼接对象。",
    "IDALib 模式必须 `import idapro` 在最前，且 `close_database()` 在最后。",
  ],
  checklist: [
    "确认 IDA 版本（API 在 7.x / 8.x / 9.x 之间有重大变化）。",
    "`idaapi.FlowChart` 使用 `flags=idaapi.FC_PREDS` 获取前驱块。",
    "Appcall 需要在调试态执行，非调试态会抛异常。",
    "IDALib `close_database(save=True)` 会写 .idb，确认是否需要。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      reason: "需要先建立逆向目标、字符串/xref 线索、函数边界或算法假设时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "直接在反编译中搜字符串",
      pass: "先用字符串交叉引用缩小范围",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 IDA 版本、是否有 Hex-Rays、是否处于调试态，以及脚本运行在 GUI IDA 还是 IDALib。",
      "函数遍历用 `idautils.Functions()` 搭配 `idc.get_func_name`，基本块分析用 `idaapi.FlowChart` 并按需开启前驱块。",
      "字节搜索用 `idc.find_bytes()` 循环，命中 `ida_idaapi.BADADDR` 立即停止。",
      "交叉引用用 `idautils.XrefsTo(target_ea)` 或字符串 xref 先缩小范围，再进入函数级分析。",
      "Hex-Rays 结果用 `ida_hexrays.decompile()` 后转 `str(dec)` 文本；不要直接拼接反编译对象。",
      "IDALib 批量模式必须第一行 `import idapro`，打开数据库、导出 JSON、最后 `close_database(save=False)` 或明确确认保存。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "脚本目标、IDA/Hex-Rays/IDALib 版本假设和运行模式。",
      "函数遍历、字节搜索、xref、反编译或批量导出的脚本片段。",
      "输出文件结构、保存策略、异常处理和需要静态逆向联动的线索。",
    ],
  }),
  tools: [],
});
