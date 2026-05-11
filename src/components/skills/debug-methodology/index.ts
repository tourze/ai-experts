import {
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  InvocationPolicy,
  KnownTool,
  Platform,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, debugMethodologyDebugChecklist } from "../../procedures/index";
import { refactoringChecklistSkill } from "../refactoring-checklist/index";
import { testDrivenDevelopmentSkill } from "../test-driven-development/index";

export const debugMethodologySkill = defineSkill({
  id: "debug-methodology",
  fullName: "系统化调试方法论",
  description: "当用户卡在 bug、stack trace、崩溃、间歇性失败或 flaky 行为，需要系统化调试时使用。",
  useCases: [
    "用户遇到 bug、异常行为、崩溃或性能问题。",
    "用户已经试过一些修复但问题仍在，需要系统化排查。",
    "需要把复现、隔离、假设、验证、修复和回归测试串成证据链。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "严格按六步流程推进，不跳步，尤其不能跳过\"复现\"直接猜原因。",
    "每步都要有可观测证据，不靠直觉。",
    "同一时间只变更一个变量。",
    "修复必须针对根因，不是症状。",
    "假设 10 分钟未证实就换假设。",
    "**假设源头要先验证再改代码**：当问题是「为什么 X 还会出现」「来源在哪」类时，找到一个看似合理的来源不许直接写修复脚本。先用一行最小复刻验证，复现或反证通过才动代码。",
  ],
  checklist: [
    "已稳定复现，或记录了无法复现的条件。",
    "已缩小到具体模块/函数/行。",
    "假设基于证据，每次只变更一个变量。",
    "修复针对根因，不是症状。",
    "已补回归测试。",
  ],
  relatedSkills: [
    {
      get skill() {
        return testDrivenDevelopmentSkill;
      },
      reason: "根因修复后需要补回归测试、先写失败用例或用测试锁住复现条件时联动。",
    },
    {
      get skill() {
        return refactoringChecklistSkill;
      },
      reason: "修复涉及重构、拆分风险或需要保持行为不变的结构调整时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用一句话写下用户可观察到的问题和期望/实际差异；必要时调用 debug-checklist 生成六步骨架。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按复现、隔离、假设、验证、修复、回归测试推进，不跳过复现直接猜原因。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每轮只验证一个假设，记录命令、环境、输入、输出摘要和反证结果；假设 10 分钟未证实就换。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "找到看似合理来源时先做最小复刻验证，复现或反证通过后才改代码。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "修复针对根因最小化落地，补回归测试并跑现有测试；LLDB/GDB 场景按对应 reference 分诊。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "复现条件、隔离范围、假设列表、验证命令、证据摘要和根因结论。",
      "最小修复方案、回归测试、已运行测试和未覆盖风险。",
      "需要读取的 six-steps、discipline-guard、debug-flow 或 LLDB/GDB reference。",
    ],
  }),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  procedures: [
    procedureUse(debugMethodologyDebugChecklist, {
      label: "生成调试检查清单",
      when: "问题边界还不清楚，需要先生成六步调试骨架时。",
      reason: "强制补齐复现、假设、证据、修复和回归验证。",
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
  ],
});
