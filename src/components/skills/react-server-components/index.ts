import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for react-server-components.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
