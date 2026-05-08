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
import { androidArchitectureSkill } from "../../skills/android-architecture/index";
import { androidCoroutinesSkill } from "../../skills/android-coroutines/index";
import { androidDesignGuidelinesSkill } from "../../skills/android-design-guidelines/index";
import { androidAccessibilitySkill } from "../../skills/android-accessibility/index";
import { androidTestingSkill } from "../../skills/android-testing/index";
import { gradleBuildPerformanceSkill } from "../../skills/gradle-build-performance/index";
import { androidRedexSkill } from "../../skills/android-redex/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const androidReviewerAgent = defineAgent({
  id: "android-reviewer",
  description: "当需要只读审查 Android 架构、Lifecycle、Jetpack Compose、无障碍、性能、Gradle 和 Manifest 时使用。",
  role: `你是资深 Android 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: androidArchitectureSkill.id,
        label: "门禁 1",
        checks: "分层合规：Clean Architecture 分层、Hilt scope、模块边界",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: androidDesignGuidelinesSkill.id,
        label: "门禁 2",
        checks: "设计合规：Material Design 3 组件使用、动态颜色、触摸目标",
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
        id: "route-android-architecture",
        triggers: ["ViewModel", "Lifecycle", "repeatOnLifecycle", "launch"],
        skill: androidArchitectureSkill.id,
        checks: "ViewModel scope、SavedStateHandle、生命周期感知收集",
        output: "生命周期审计",
      }),
      defineWorkflowRoute({
        id: "route-android-coroutines",
        triggers: ["suspend", "Flow", "StateFlow", "CoroutineScope", "Dispatchers"],
        skill: androidCoroutinesSkill.id,
        checks: "Dispatcher 注入、Main-Safety、GlobalScope 禁用、协作取消",
        output: "协程安全结论",
      }),
      defineWorkflowRoute({
        id: "route-android-design-guidelines",
        triggers: ["@Composable", "remember", "LaunchedEffect", "LazyColumn"],
        skill: androidDesignGuidelinesSkill.id,
        checks: "Compose 稳定性、recomposition、side-effect 位置、Lazy list key",
        output: "Compose 审查",
      }),
      defineWorkflowRoute({
        id: "route-android-accessibility",
        triggers: ["contentDescription", "semantics", "touchTarget", "Accessibility"],
        skill: androidAccessibilitySkill.id,
        checks: "TalkBack、触摸目标 48dp、对比度、焦点管理",
        output: "无障碍审计",
      }),
      defineWorkflowRoute({
        id: "route-android-testing",
        triggers: ["@Test", "HiltAndroidTest", "Roborazzi", "ComposeTest"],
        skill: androidTestingSkill.id,
        checks: "测试分层、Hilt 集成测试、截图测试、Compose 测试",
        output: "测试质量审计",
      }),
      defineWorkflowRoute({
        id: "route-gradle-build-performance",
        triggers: ["Gradle 构建慢", "依赖冲突"],
        skill: gradleBuildPerformanceSkill.id,
        checks: "配置阶段耗时、并行构建、依赖缓存",
        output: "构建优化建议",
      }),
      defineWorkflowRoute({
        id: "route-android-redex",
        triggers: ["APK", "AAB 体积", "ReDex 配置"],
        skill: androidRedexSkill.id,
        checks: "ProGuard 规则、ReDex pass 配置、资源压缩",
        output: "包体积优化",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：android-architecture → android-design-guidelines → 确认基线",
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
        label: "排序：安全 > 正确性 > 影响面 > 执行成本",
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
      reason: "提供只读审查的共享门禁与证据绑定规则。",
    },
    {
      id: androidArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Clean Architecture 分层与 Hilt 注入。",
    },
    {
      id: androidCoroutinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查协程 Dispatcher、Main-Safety 与取消安全。",
    },
    {
      id: androidDesignGuidelinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Material Design 3 与 Compose 组件合规。",
    },
    {
      id: androidAccessibilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 TalkBack、触摸目标与对比度合规。",
    },
    {
      id: androidTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Hilt 集成测试、截图测试与 Compose 测试。",
    },
    {
      id: gradleBuildPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "排查 Gradle 构建瓶颈与依赖缓存问题。",
    },
    {
      id: androidRedexSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 APK 体积优化与 ReDex 配置。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设。",
    }
  ],
});
