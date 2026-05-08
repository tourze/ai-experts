import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const rustTokioRuntimeTuningSkill = defineSkill({
  id: "rust-tokio-runtime-tuning",
  fullName: "Rust Tokio Runtime Tuning",
  description: "当用户需要调优 Tokio 运行时配置时使用；涉及 Runtime::builder、worker 线程数、blocking 线程池或 current_thread 时触发。",
  useCases: [
    "为服务/CLI/移动端选择合适的 runtime 配置。",
    "调整 worker 线程数、blocking 上限或栈大小。",
    "在同步代码中嵌入 async（`block_on` 桥接）。",
    "用 metrics / tokio-console 定位瓶颈。",
  ],
  constraints: [
    "`worker_threads` 先测量再设；默认 num_cpus 常过多。",
    "同步 IO / CPU 密集必须 `spawn_blocking`。",
    "组件有独立生命周期时用独立 Runtime。",
    "资源受限环境优先 `current_thread`。",
    "`max_blocking_threads` 按实际阻塞数设；默认 512 过大。",
    "`block_on` 只在非 async 上下文调用。",
    "先观测再调参。",
  ],
  checklist: [
    "worker_threads 基于实测？有 worker 上的阻塞操作？",
    "`block_on` 只在非 async 上下文？线程名有意义？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "async 内调 block_on",
      pass: "直接 await",
    }),
    defineAntiPattern({
      fail: "worker 上做同步阻塞",
      pass: "spawn_blocking 隔离",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认服务类型、部署资源、阻塞操作比例、runtime 生命周期和观测数据。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "基于测量结果调整 worker_threads、max_blocking_threads、stack_size 和 thread_name。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "同步桥接只在非 async 上下文使用 `block_on`，async 内直接 await。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "按需读取 `patterns` 中的 Runtime Builder、按需创建、block_on 桥接和 runtime metrics 模式。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "runtime 类型、线程池参数、blocking 隔离和生命周期建议。",
      "观测指标、tokio-console / metrics 配置和验证方法。",
      "需要引用的 `patterns` 模式和仍需测量的数据。",
    ],
  }),
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Runtime::builder 参数、worker/blocking 线程数调优与 tokio-console 观测配置。",
      loadWhen: "需要调整 Tokio 运行时线程数、配置 block_on 桥接或使用 tokio-console 定位瓶颈时读取。",
    }),
  ],
});
