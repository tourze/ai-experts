import {
  defineReference,
  defineSkill,
  defineSkillScript,
  InvocationPolicy,
  KnownTool,
  Platform,
} from "../../sdk";

export const debugMethodology = defineSkill({
  id: "debug-methodology",
  fullName: "系统化调试方法论",
  description: "当用户卡在 bug、stack trace、崩溃、间歇性失败或 flaky 行为，需要系统化调试时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  scripts: [
    defineSkillScript({
      id: "debug-checklist",
      entry: new URL("./scripts/debug-checklist.ts", import.meta.url),
      description: "根据问题标题生成六步调试检查清单骨架。",
      argsSchema: "DebugChecklistArgs",
      outputSchema: "MarkdownChecklist",
    }),
  ],
  references: [
    defineReference({
      id: "six-steps",
      source: new URL("./references/six-steps.md", import.meta.url),
      target: "references/six-steps.md",
      title: "Six Step Debug Flow",
      summary: "复现、隔离、假设、验证、修复、回归测试的细化步骤。",
      loadWhen: "需要展开完整调试流程或判断当前步骤是否跳步时读取。",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "Debug Discipline Guard",
      summary: "调试过程中的危险念头、合理化借口和现实后果。",
      loadWhen: "模型或用户想直接改代码、吞异常、同时改多处时读取。",
    }),
    defineReference({
      id: "debug-flow",
      source: new URL("./references/debug-flow.dot", import.meta.url),
      target: "references/debug-flow.dot",
      title: "Debug Flow Graph",
      summary: "六步调试流程的 DOT 图。",
      loadWhen: "需要把调试流程可视化或生成流程图时读取。",
    }),
    defineReference({
      id: "debug-lldb",
      source: new URL("./references/debug-lldb.md", import.meta.url),
      target: "references/debug-lldb.md",
      title: "LLDB Debugging Notes",
      summary: "LLDB 调试命令和排障注意事项。",
      loadWhen: "需要用 LLDB 调试原生崩溃、断点或线程问题时读取。",
    }),
    defineReference({
      id: "gdb-nonblocking",
      source: new URL("./references/gdb-nonblocking.md", import.meta.url),
      target: "references/gdb-nonblocking.md",
      title: "GDB Nonblocking Notes",
      summary: "非阻塞方式运行 GDB 的注意事项。",
      loadWhen: "需要用 GDB 采集信息且不能卡住当前会话时读取。",
    }),
    defineReference({
      id: "lldb-triage",
      source: new URL("./references/lldb-triage.md", import.meta.url),
      target: "references/lldb-triage.md",
      title: "LLDB Triage",
      summary: "LLDB 快速分诊流程。",
      loadWhen: "需要先分诊原生崩溃或堆栈异常再决定深入路径时读取。",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "debug-methodology 的触发与反触发用例。",
      loadWhen: "只在验证或改进本 skill 时读取。",
    }),
  ],
});

export const debugMethodologySkill = debugMethodology;
