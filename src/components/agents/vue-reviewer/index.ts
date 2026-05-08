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
import { vueExpertJsSkill } from "../../skills/vue-expert-js/index";
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { javascriptTypescriptJestSkill } from "../../skills/javascript-typescript-jest/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const vueReviewerAgent = defineAgent({
  id: "vue-reviewer",
  description: "当需要只读审查 Vue 3 Composition API、响应式、组件设计、Pinia、Router 和模板性能 时使用。",
  role: `你是资深 Vue.js 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: vueExpertJsSkill.id,
        label: "门禁 1",
        checks: "组件结构基线：script setup、响应式 API 使用、composable 规范",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: modernJavascriptPatternsSkill.id,
        label: "门禁 2",
        checks: "JS 惯用法：模块系统、解构、可选链",
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
        id: "route-vue-expert-js",
        triggers: ["ref", "reactive", "computed", "watch", "watchEffect"],
        skill: vueExpertJsSkill.id,
        checks: "响应式丢失、watch 深度监听、computed 副作用、shallowRef 误用",
        output: "响应式审计",
      }),
      defineWorkflowRoute({
        id: "route-vue-expert-js-2",
        triggers: ["use[A-Z]", "onMounted", "onUnmounted"],
        skill: vueExpertJsSkill.id,
        checks: "composable 返回契约、cleanup 注册、命名规范、职责边界",
        output: "Composable 审查",
      }),
      defineWorkflowRoute({
        id: "route-vue-expert-js-3",
        triggers: ["props", "emits", "defineProps", "defineEmits", "slot"],
        skill: vueExpertJsSkill.id,
        checks: "props 验证、emits 声明、组件拆分粒度、slot 类型安全",
        output: "组件接口审查",
      }),
      defineWorkflowRoute({
        id: "route-vue-expert-js-4",
        triggers: ["<RouterView>", "useRouter", "useRoute", "router-link"],
        skill: vueExpertJsSkill.id,
        checks: "路由 guard、lazy loading、参数传递、导航守卫",
        output: "路由审计",
      }),
      defineWorkflowRoute({
        id: "route-vue-expert-js-5",
        triggers: ["createPinia", "defineStore", "storeToRefs"],
        skill: vueExpertJsSkill.id,
        checks: "store 边界、action 异步处理、getter 计算、store 拆分",
        output: "状态管理审计",
      }),
      defineWorkflowRoute({
        id: "route-vue-expert-js-6",
        triggers: ["v-for", "v-if", "v-show", "<template>"],
        skill: vueExpertJsSkill.id,
        checks: "v-for key、v-if vs v-show、模板内计算、大列表性能",
        output: "模板性能审查",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：vue-expert-js → modern-javascript-patterns → 确认基线",
      }),
      defineWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配场景路由表，逐项深入",
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
      reason: "提供只读 reviewer 的共享门禁、只读边界与证据绑定规则。",
    },
    {
      id: vueExpertJsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Vue 3 响应式、composable、组件接口与模板性能。",
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 JS 模块系统、解构与异步惯用法。",
    },
    {
      id: javascriptTypescriptJestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查测试覆盖、mock 边界与异步测试质量。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查测试策略、隔离性与断言质量。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设并绑定位置。",
    }
  ],
});
