import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const idapythonScriptingSkill = defineSkill({
  id: "idapython-scripting",
  fullName: "IDAPython 脚本参考",
  description: "当需要编写 IDAPython 脚本做函数遍历、交叉引用、字节搜索、Hex-Rays 反编译或 IDALib 批量分析时使用。",
  useCases: [
    "需要在 IDA 中批量重命名、搜索字节模式、遍历函数或基本块。",
    "需要用 Hex-Rays 反编译器 API 读取或修改伪代码。",
    "需要用 IDALib (IDA 9.0+) 做无 GUI 的批量分析。",
    "需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合做深入逆向。",
  ],
  constraints: [
    "区分调试态 API (`read_dbg_byte`) 和 IDB 态 API (`get_db_byte`)。",
    "`idc.find_bytes()` 返回 `BADADDR` 时停止循环。",
    "Hex-Rays 反编译结果用 `str(dec)` 转文本，不要直接拼接对象。",
    "IDALib 模式必须 `import idapro` 在最前，且 `close_database()` 在最后。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
