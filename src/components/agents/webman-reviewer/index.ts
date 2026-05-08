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
import { webmanNamingConventionsSkill } from "../../skills/webman-naming-conventions/index";
import { webmanCustomProcessesSkill } from "../../skills/webman-custom-processes/index";
import { webmanWebsocketPatternsSkill } from "../../skills/webman-websocket-patterns/index";
import { webmanPluginDevelopmentSkill } from "../../skills/webman-plugin-development/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const webmanReviewerAgent = defineAgent({
  id: "webman-reviewer",
  description: "当需要只读审查 Webman 命名规范、自定义进程、WebSocket、插件机制以及 worker 长生命周期风险时使用。",
  role: `你是资深 Webman / Workerman 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: webmanNamingConventionsSkill.id,
        label: "门禁 1",
        checks: "命名合规：目录大小写、Controller/Service 后缀、命名空间与 PSR-4 对齐",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: webmanCustomProcessesSkill.id,
        label: "门禁 2",
        checks: "进程声明：count、reloadable、crash-restart 策略",
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
        id: "route-webman-custom-processes",
        triggers: ["Timer", "Crontab", "process"],
        skill: webmanCustomProcessesSkill.id,
        checks: "定时器生命周期、Crontab 调度、进程间通信、crash-restart",
        output: "进程审计",
      }),
      defineWorkflowRoute({
        id: "route-webman-websocket-patterns",
        triggers: ["WebSocket", "onMessage", "GatewayWorker", "Channel"],
        skill: webmanWebsocketPatternsSkill.id,
        checks: "连接生命周期、心跳、广播、频道订阅、退避重连、半开连接清理",
        output: "WebSocket 审计",
      }),
      defineWorkflowRoute({
        id: "route-webman-plugin-development",
        triggers: ["Install.php", "plugin", "Bootstrap"],
        skill: webmanPluginDevelopmentSkill.id,
        checks: "插件安装/卸载、配置发布路径、跨插件冲突",
        output: "插件审计",
      }),
      defineWorkflowRoute({
        id: "route-webman-custom-processes-2",
        triggers: ["$_SESSION"],
        skill: webmanCustomProcessesSkill.id,
        checks: "worker 状态污染、内存泄漏、跨请求脏数据",
        output: "worker 生命周期审计",
      }),
      defineWorkflowRoute({
        id: "route-webman-custom-processes-3",
        triggers: ["PDO", "Illuminate\\Database"],
        skill: webmanCustomProcessesSkill.id,
        checks: "长连接断线重连、事务跨请求边界、连接预热",
        output: "数据库连接审计",
      }),
      defineWorkflowRoute({
        id: "route-webman-custom-processes-4",
        triggers: ["file_get_contents", "sleep", "curl"],
        skill: webmanCustomProcessesSkill.id,
        checks: "event loop 阻塞风险、异步替代方案",
        output: "阻塞陷阱审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：webman-naming-conventions → webman-custom-processes → 确认基线",
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
        label: "排序：worker 状态污染 > 连接池失效 > event loop 阻塞 > WebSocket 泄漏 > 命名/结构",
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
      id: webmanNamingConventionsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查目录命名、接口后缀与命名空间一致性。",
    },
    {
      id: webmanCustomProcessesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查自定义进程声明、Timer 与 event loop 阻塞风险。",
    },
    {
      id: webmanWebsocketPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 WebSocket 连接生命周期、心跳与频道广播。",
    },
    {
      id: webmanPluginDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查插件安装/卸载、配置发布路径与跨插件冲突。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设并绑定位置。",
    }
  ],
});
