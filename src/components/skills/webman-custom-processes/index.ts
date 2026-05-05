import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const webmanCustomProcessesSkill = defineSkill({
  id: "webman-custom-processes",
  fullName: "Webman Custom Processes",
  description: "当用户要声明或排查 Webman 自定义进程、Timer、Crontab 或 crash-restart 时使用。",
  useCases: [
    "声明后台 Worker、心跳、定时任务。",
    "排查进程阻塞、Timer 不触发。",
    "实现 crash-restart 或优雅停机。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "crash-recovery",
      source: new URL("./references/crash-recovery.md", import.meta.url),
      target: "references/crash-recovery.md",
      title: "crash-recovery.md",
      summary: "Reference material for webman-custom-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "crontab-scheduling",
      source: new URL("./references/crontab-scheduling.md", import.meta.url),
      target: "references/crontab-scheduling.md",
      title: "crontab-scheduling.md",
      summary: "Reference material for webman-custom-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "event-loop-blocking",
      source: new URL("./references/event-loop-blocking.md", import.meta.url),
      target: "references/event-loop-blocking.md",
      title: "event-loop-blocking.md",
      summary: "Reference material for webman-custom-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "process-lifecycle",
      source: new URL("./references/process-lifecycle.md", import.meta.url),
      target: "references/process-lifecycle.md",
      title: "process-lifecycle.md",
      summary: "Reference material for webman-custom-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "timer-management",
      source: new URL("./references/timer-management.md", import.meta.url),
      target: "references/timer-management.md",
      title: "timer-management.md",
      summary: "Reference material for webman-custom-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
