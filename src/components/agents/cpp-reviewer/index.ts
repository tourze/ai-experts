import {
  AgentSandbox,
  defineAgent,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { memorySafetyPatternsSkill } from "../../skills/memory-safety-patterns/index";
import { codeReviewSkill } from "../../skills/code-review/index";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const cppReviewerAgent = defineAgent({
  id: "cpp-reviewer",
  description: "当需要执行 C/C++ 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 C/C++ 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: memorySafetyPatternsSkill.id,
        label: "门禁 1",
        checks: "内存安全基线：RAII、智能指针、裸指针生命周期、double free/use-after-free",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: codeReviewSkill.id,
        label: "门禁 2",
        checks: "通用代码质量：命名、职责、错误处理、边界条件",
      }),
      defineWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "route-memory-safety-patterns",
        triggers: ["new", "delete", "malloc", "free", "memcpy"],
        skill: memorySafetyPatternsSkill.id,
        checks: "所有权模型、越界、未初始化、use-after-free、double free",
        output: "内存安全漏洞清单",
      }),
      defineWorkflowRoute({
        id: "route-memory-safety-patterns-2",
        triggers: ["mutex", "atomic", "thread", "lock", "condition_variable"],
        skill: memorySafetyPatternsSkill.id,
        checks: "数据竞争、死锁顺序、线程生命周期、锁粒度",
        output: "并发安全结论",
      }),
      defineWorkflowRoute({
        id: "route-complexity-reducer",
        triggers: ["复杂函数", "深度嵌套", "长文件"],
        skill: complexityReducerSkill.id,
        checks: "复杂度度量、拆分建议、圈复杂度热点",
        output: "复杂度报告",
      }),
      defineWorkflowRoute({
        id: "route-debug-methodology",
        triggers: ["Bug", "崩溃", "栈跟踪", "SIGSEGV"],
        skill: debugMethodologySkill.id,
        checks: "假设驱动调试、根因分析、证据链",
        output: "根因分析报告",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：memory-safety-patterns → code-review → 确认基线",
      }),
      defineWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配本 workflow 的 route 节点，逐项深入",
      }),
      defineWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineWorkflowStep({
        id: "final-5",
        label: "排序：内存安全 > 并发安全 > 正确性 > 影响面 > 执行成本",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供只读审查的共享门禁、边界与证据绑定规则。",
    },
    {
      id: memorySafetyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查 RAII、智能指针与裸指针生命周期等内存安全问题。",
    },
    {
      id: codeReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查命名、职责、错误处理与边界条件等通用代码质量。",
    },
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "按假设驱动调试收敛崩溃与根因证据。",
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "识别深度嵌套与长函数，给出复杂度拆分建议。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设并绑定代码位置。",
    }
  ],
});
