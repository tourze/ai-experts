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
import { nextjsDeveloperSkill } from "../nextjs-developer/index";
import { webPerformanceDiagnosisSkill } from "../web-performance-diagnosis/index";

export const reactServerComponentsSkill = defineSkill({
  id: "react-server-components",
  fullName: "React Server Components",
  description: "当用户需要实现 RSC 架构、服务端组件边界、Server Actions、streaming 渲染、客户端组件拆分、RSC 性能优化、数据瀑布并行化、React.cache 去重、序列化开销治理或表单提交时使用。",
  useCases: [
    "项目使用 Next.js App Router，需要在服务端组件与客户端组件之间划边界。",
    "需要把数据获取、鉴权、缓存、重验证或变更动作放回服务端。",
    "需要利用 `Suspense`、流式渲染和并行数据获取减少 waterfalls。",
    "Server Components 存在串行数据获取，需要并行化。",
    "Server Actions 缺少认证/授权检查，存在安全风险。",
    "RSC 边界传递了过多 props，导致序列化开销过大。",
    "需要在服务端做请求级去重（React.cache）或跨请求缓存（LRU）。",
    "更完整的 Next.js 框架层约束可联动 `nextjs-developer`。",
    "消除请求瀑布流可联动 `web-performance-diagnosis`。",
  ],
  constraints: [
    "在 App Router 中默认把组件视为 Server Component；只有交互边界才显式加 `'use client'`。",
    "Server Component 不能使用客户端 Hook、浏览器 API 或事件处理器。",
    "传给 Client Component 的 props 必须可序列化，且不要把 secrets、数据库连接或大对象往下透传。",
    "服务端能直接拿到数据库、文件系统、cookies、headers 时，不要再绕自己 API 一圈。",
    "Server Actions 既是写路径也是安全边界；必须在函数体内做鉴权/授权，不能依赖 middleware 或页面级守卫。",
    "服务端模块不能存放请求相关的可变状态（跨请求污染）；React.cache() 只做请求级去重，跨请求缓存用 LRU 或外部缓存。",
    "RSC props 只传最小必要数据，避免把整个数据库对象序列化到客户端。",
  ],
  checklist: [
    "当前组件是否真的需要 `'use client'`，还是可以留在服务端？",
    "Server Component 是否直接使用了浏览器 API 或客户端 Hook？",
    "数据获取是否已经并行化，避免无意义串行等待？",
    "传给 Client Component 的 props 是否可序列化且足够小？",
    "Server Action 是否包含鉴权、输入校验和重验证逻辑？",
    "是否避免了”Server Component 调自己 API route”这种额外 hop？",
    "服务端模块是否避免了请求级可变状态？",
    "同一请求内的重复数据获取是否用 React.cache() 去重？",
    "嵌套 Server Components 的数据获取是否做了并行化？",
    "非阻塞操作（日志、分析）是否用 after() 延迟执行？",
  ],
  relatedSkills: [
    {
      get skill() {
        return nextjsDeveloperSkill;
      },
      reason: "需要完整 Next.js App Router、Route Handler、Metadata 或部署约束时联动。",
    },
    {
      get skill() {
        return webPerformanceDiagnosisSkill;
      },
      reason: "RSC 问题表现为首屏、瀑布流、序列化或缓存性能退化时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "整页 'use client'",
      pass: "服务端获取 + 局部交互",
    }),
    defineAntiPattern({
      fail: "Server Action 无认证授权",
      pass: "Action 内部校验身份、权限和输入",
    }),
    defineAntiPattern({
      fail: "模块级保存请求状态",
      pass: "请求状态放入请求作用域或显式参数",
    }),
    defineAntiPattern({
      fail: "整 row 序列化到客户端",
      pass: "只传最小可序列化 props",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先识别组件是否真的需要客户端交互，默认保留 Server Component，只在交互叶子加 `'use client'`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "并行化互不依赖的数据获取，使用 Suspense / streaming 暴露加载边界，避免嵌套 waterfall。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Server Action 内部执行鉴权、授权、输入校验和重验证；Client Component props 只传最小可序列化数据。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "并行 fetch 代码读取 `server-component-patterns`；缓存、streaming 和高级反模式读取 `advanced` / `advanced-patterns` / `rsc-rules`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Server / Client Component 边界和 `'use client'` 下沉建议。",
      "数据获取并行化、缓存、streaming、Server Action 安全和序列化治理方案。",
      "需要补的性能测量、请求去重、安全测试和 RSC 边界验证。",
    ],
  }),
  references: [
    defineReference({
      id: "server-component-patterns",
      source: new URL("./references/server-component-patterns.md", import.meta.url),
      target: "references/server-component-patterns.md",
      title: "RSC 基础代码模式",
      summary: "Server Component 中并行获取数据的基础示例和相关进阶资料入口。",
      loadWhen: "需要快速实现 React Server Component 数据获取或边界示例时读取。",
    }),
    defineReference({
      id: "advanced",
      source: new URL("./references/advanced.md", import.meta.url),
      target: "references/advanced.md",
      title: "RSC 流式与缓存模式",
      summary: "React Server Components 的 streaming、缓存和进阶实现模式。",
      loadWhen: "需要更完整的 RSC 流式渲染或缓存策略时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "RSC 边界划分、序列化陷阱、Server Actions 鉴权、React.cache 去重与流式渲染等高级模式。",
      loadWhen: "需要处理 RSC 边界拆分、序列化开销治理、Server Action 安全或数据获取合并时读取。",
    }),
    defineReference({
      id: "rsc-rules",
      source: new URL("./references/rules/", import.meta.url),
      target: "references/rules",
      title: "React Server Components Rules",
      summary: "RSC 请求级去重、并行获取、缓存、序列化、Server Actions 和 after() 的专项规则。",
      loadWhen: "需要按具体 RSC 性能、安全或边界场景读取专项规则时读取。",
    }),
  ],
});
