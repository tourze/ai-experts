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
import { reactNativeDesignSkill } from "../../skills/react-native-design/index";
import { reactNativeJsPerformanceSkill } from "../../skills/react-native-js-performance/index";
import { reactNativePlatformForkSkill } from "../../skills/react-native-platform-fork/index";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index";
import { reactNativeTurbomoduleSkill } from "../../skills/react-native-turbomodule/index";
import { reactNativeMetroConfigSkill } from "../../skills/react-native-metro-config/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const reactNativeReviewerAgent = defineAgent({
  id: "react-native-reviewer",
  description: "当需要只读审查 React Native 架构、导航、列表性能、JSI/Bridge、原生模块和平台分叉时使用。",
  role: `你是资深 React Native 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: reactNativeDesignSkill.id,
        label: "门禁 1",
        checks: "架构基线：导航结构、样式组织、平台适配、安全区域",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: reactNativeJsPerformanceSkill.id,
        label: "门禁 2",
        checks: "性能基线：JS thread 占用、FlatList 配置、掉帧热点",
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
        id: "route-react-native-js-performance",
        triggers: ["FlatList", "SectionList", "FlashList"],
        skill: reactNativeJsPerformanceSkill.id,
        checks: "key、windowing、memoization、JS thread 掉帧、FPS",
        output: "列表性能审计",
      }),
      defineWorkflowRoute({
        id: "route-react-native-design",
        triggers: ["NavigationContainer", "Stack", "Tab", "deep link"],
        skill: reactNativeDesignSkill.id,
        checks: "导航层级、生命周期、deep link 解析、内存泄漏",
        output: "导航审计",
      }),
      defineWorkflowRoute({
        id: "route-react-native-design-2",
        triggers: ["Animated", "Reanimated", "Gesture"],
        skill: reactNativeDesignSkill.id,
        checks: "手势冲突、动画性能、JS/Native 线程分配",
        output: "交互审计",
      }),
      defineWorkflowRoute({
        id: "route-react-native-platform-fork",
        triggers: ["Platform.OS", ".ios.", ".android."],
        skill: reactNativePlatformForkSkill.id,
        checks: "分叉粒度、共享代码比例、平台特定配置",
        output: "平台分叉审计",
      }),
      defineWorkflowRoute({
        id: "route-react-native-turbomodule",
        triggers: ["TurboModule", "TurboModuleRegistry", "codegenConfig"],
        skill: reactNativeTurbomoduleSkill.id,
        checks: "New Architecture 迁移、TurboModule 注册、codegen 配置",
        output: "原生模块审计",
      }),
      defineWorkflowRoute({
        id: "route-react-native-metro-config",
        triggers: ["metro.config"],
        skill: reactNativeMetroConfigSkill.id,
        checks: "Metro 配置、watchFolders、resolver、bundle 体积",
        output: "构建配置审计",
      }),
      defineWorkflowRoute({
        id: "route-detox-mobile-test",
        triggers: ["detox", "device.", "element("],
        skill: detoxMobileTestSkill.id,
        checks: "测试稳定性、matcher 策略、CI 设备配置、flaky test",
        output: "E2E 测试审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：react-native-design → react-native-js-performance → 确认基线",
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
      reason: "提供统一代码审查流程和发现分级框架。",
    },
    {
      id: reactNativeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查导航层级、deep link 和样式组织。",
    },
    {
      id: reactNativeJsPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查列表性能、JS 线程掉帧和 FPS 热点。",
    },
    {
      id: reactNativePlatformForkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查平台分叉粒度和共享代码比例。",
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 E2E 测试稳定性、matcher 策略和 CI 配置。",
    },
    {
      id: reactNativeTurbomoduleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 TurboModule 注册和 codegen 配置。",
    },
    {
      id: reactNativeMetroConfigSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Metro 配置和 bundle 体积。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
