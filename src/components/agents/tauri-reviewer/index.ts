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
import { tauriIpcPatternsSkill } from "../../skills/tauri-ipc-patterns/index";
import { tauriV2Skill } from "../../skills/tauri-v2/index";
import { tauriReactIntegrationSkill } from "../../skills/tauri-react-integration/index";
import { tauriBuildPackagingSkill } from "../../skills/tauri-build-packaging/index";
import { tauriPluginDevelopmentSkill } from "../../skills/tauri-plugin-development/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const tauriReviewerAgent = defineAgent({
  id: "tauri-reviewer",
  description: "当需要只读审查 Tauri IPC、权限范围、插件架构、构建配置和前后端边界 时使用。",
  role: `你是资深 Tauri 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: tauriV2Skill.id,
        label: "门禁 1",
        checks: "项目结构基线：tauri.conf.json、capabilities 声明、Cargo.toml 配置",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: tauriIpcPatternsSkill.id,
        label: "门禁 2",
        checks: "IPC 安全基线：command 权限声明、参数校验、错误类型",
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
        id: "route-tauri-ipc-patterns",
        triggers: ["#[tauri::command]", "invoke"],
        skill: tauriIpcPatternsSkill.id,
        checks: "command 签名、判别联合错误、Channel<T> 流、多窗口路由",
        output: "IPC 审计",
      }),
      defineWorkflowRoute({
        id: "route-tauri-v2",
        triggers: ["capabilities", "permissions", "windows", "scope"],
        skill: tauriV2Skill.id,
        checks: "最小权限、危险命令 opt-in、window scope、CSP 配置",
        output: "权限安全审计",
      }),
      defineWorkflowRoute({
        id: "route-tauri-react-integration",
        triggers: ["invoke", "useInvoke", "event"],
        skill: tauriReactIntegrationSkill.id,
        checks: "invoke 封装、useInvoke Hook、事件监听生命周期、Router 深链",
        output: "前端集成审计",
      }),
      defineWorkflowRoute({
        id: "route-tauri-build-packaging",
        triggers: ["tauri.conf.json", "bundler"],
        skill: tauriBuildPackagingSkill.id,
        checks: "bundle 配置、代码签名、公证、自动更新、sidecar",
        output: "构建打包审计",
      }),
      defineWorkflowRoute({
        id: "route-tauri-plugin-development",
        triggers: ["Plugin", "Builder", "setup", "on_event"],
        skill: tauriPluginDevelopmentSkill.id,
        checks: "插件注册、生命周期钩子、桌面/移动拆分、state 管理",
        output: "插件架构审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：tauri-v2 → tauri-ipc-patterns → 确认基线",
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
        label: "排序：安全（capabilities/权限/command 注入） > 正确性 > 影响面 > 执行成本",
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
      reason: "提供代码审查通用方法论与检查清单。",
    },
    {
      id: tauriIpcPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 IPC 命令安全性与错误处理。",
    },
    {
      id: tauriV2Skill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 capabilities 声明与最小权限合规。",
    },
    {
      id: tauriReactIntegrationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查前端 invoke 调用与事件监听生命周期。",
    },
    {
      id: tauriBuildPackagingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查构建配置、签名与更新策略。",
    },
    {
      id: tauriPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查插件注册、生命周期与 state 管理。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设。",
    }
  ],
});
