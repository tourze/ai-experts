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
import { reactServerComponentsSkill } from "../react-server-components/index";
import { typescriptTypeSafetySkill } from "../typescript-type-safety/index";

export const nextjsDeveloperSkill = defineSkill({
  id: "nextjs-developer",
  fullName: "Next.js Developer",
  description: "当用户提到 Next.js、App Router、Server Components、Server Actions、Route Handlers 或 Vercel 部署时使用。",
  useCases: [
    "需要在 `app/` 目录下设计路由树、`layout.tsx` / `template.tsx` / `loading.tsx` / `error.tsx` / `route.ts` 的职责划分时使用。",
    "需要决定某段 UI 应该保持 Server Component、下沉为 Client Component，还是拆成 Server + Client island 时使用。",
    "需要为数据获取、缓存、ISR、按路径/标签重验证、Server Actions、Metadata API、Middleware、Edge Runtime 或 Vercel 部署做实现选择时使用。",
    "复杂 RSC 边界和性能问题优先联动 `react-server-components`；需要类型体操或 DTO/泛型修复时联动 `typescript-type-safety`。",
    "需要展开细节时按主题加载参考资料：\n[App Router](references/app-router.md)、\n[Server Components](references/server-components.md)、\n[Server Actions](references/server-actions.md)、\n[Data Fetching](references/data-fetching.md)、\n[Deployment](references/deployment.md)。",
  ],
  constraints: [
    "默认使用 App Router；除非明确维护遗留项目，否则不要把新实现落到 `pages/`。",
    "默认保持 Server Components，只在交互真正发生的叶子节点添加 `'use client'`。",
    "所有 `fetch` 都显式写出 `cache`、`next.revalidate` 或 `next.tags` 策略，不依赖隐式缓存。",
    "所有动态 SEO 都用 `metadata` / `generateMetadata`，不要在 JSX 里手写 `<title>` / `<meta>`。",
    "所有内容型图片默认走 `next/image`；公共静态资源才考虑 `<img>`。",
    "对会阻塞首屏的数据段补 `loading.tsx` / `error.tsx`，不要把错误与等待状态散落在页面组件内部。",
    "Next.js 15+ 的 `params` / `searchParams` / `cookies()` / `headers()` 已转为异步 API；面向当前版本写示例时优先使用 `Promise` / `await` 形式，并在需要兼容 Next.js 14 时显式说明。",
    "交付前必须本地运行 `next build`；如果项目使用 TypeScript，还要保证零类型错误并核对 `NEXT_PUBLIC_*` 与 server-only 环境变量边界。",
  ],
  checklist: [
    "是否明确说明页面/布局/模板/路由处理器的职责边界？",
    "是否默认保留 Server Component，并把 `'use client'` 压到了交互叶子节点？",
    "是否给每个 `fetch` 写清了缓存、重验证或标签策略？",
    "是否在动态路由、`generateMetadata`、Route Handler 里正确处理了异步 `params`？",
    "是否给异步段补了 `loading.tsx` / `error.tsx` / `not-found.tsx`？",
    "是否对 Server Action 做了输入校验、鉴权/授权、重验证和失败返回约定？",
    "是否避免把服务端密钥暴露到 `NEXT_PUBLIC_*`？",
    "是否在部署说明里覆盖 `next build`、环境变量、图片域名、运行时选择与回滚入口？",
  ],
  relatedSkills: [
    {
      get id() {
        return reactServerComponentsSkill.id;
      },
      reason: "Next.js App Router 中 RSC 边界、Server Action、安全或性能问题需要深入时联动。",
    },
    {
      get id() {
        return typescriptTypeSafetySkill.id;
      },
      reason: "动态路由 params、DTO、Server Action 输入或 API 合同类型需要收敛时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "整棵树 'use client'",
      pass: "'use client' 压到叶子",
    }),
    defineAntiPattern({
      fail: "Server Action 无校验",
      pass: "校验 + 鉴权 + revalidate",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认路由树、Server / Client Component 边界、数据获取、缓存策略、写路径和部署目标。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "默认使用 App Router 和 Server Component，只在交互叶子节点添加 `'use client'`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "所有 fetch 明确 cache / revalidate / tags，动态路由和 Metadata API 按当前版本处理异步 params。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "RSC fetch、Server Action、Metadata 和 Route Handler 示例读取 `app-router-code-patterns`；深入主题读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Next.js 路由树、布局、Server / Client Component 和 Route Handler 职责边界。",
      "fetch 缓存、ISR、tags、Server Action 校验 / 鉴权 / 重验证和 Metadata 方案。",
      "loading/error/not-found、环境变量、部署、`next build` 和回滚检查项。",
    ],
  }),
  references: [
    defineReference({
      id: "app-router-code-patterns",
      source: new URL("./references/app-router-code-patterns.md", import.meta.url),
      target: "references/app-router-code-patterns.md",
      title: "Next.js App Router 代码模式",
      summary: "Server Component 数据获取、Server Action + useActionState、异步 params Metadata 和 Route Handler 示例。",
      loadWhen: "需要快速实现 Next.js App Router 页面、表单或动态路由时读取。",
    }),
    defineReference({
      id: "app-router",
      source: new URL("./references/app-router.md", import.meta.url),
      target: "references/app-router.md",
      title: "app-router.md",
      summary: "Next.js App Router 的路由系统详解，包括 layout、template、loading、error 和路由组的设计模式。",
      loadWhen: "需要设计 App Router 路由树、划分页面模板职责或处理路由嵌套时读取。",
    }),
    defineReference({
      id: "data-fetching",
      source: new URL("./references/data-fetching.md", import.meta.url),
      target: "references/data-fetching.md",
      title: "data-fetching.md",
      summary: "Next.js 数据获取策略的完整指南，包括 fetch 缓存、ISR、按标签重验证和并行数据加载。",
      loadWhen: "需要设计数据获取、缓存策略或配置 ISR/按标签重验证时读取。",
    }),
    defineReference({
      id: "deployment",
      source: new URL("./references/deployment.md", import.meta.url),
      target: "references/deployment.md",
      title: "deployment.md",
      summary: "Next.js 项目的部署配置指南，包括环境变量、图片域名、运行时选择和回滚策略。",
      loadWhen: "需要将 Next.js 项目部署到 Vercel 或其他平台时读取。",
    }),
    defineReference({
      id: "server-actions",
      source: new URL("./references/server-actions.md", import.meta.url),
      target: "references/server-actions.md",
      title: "server-actions.md",
      summary: "Next.js Server Actions 的实现规范，包括输入校验、鉴权授权、重验证和错误处理。",
      loadWhen: "需要实现或审查 Server Actions 的输入校验、鉴权和数据重验证逻辑时读取。",
    }),
    defineReference({
      id: "server-components",
      source: new URL("./references/server-components.md", import.meta.url),
      target: "references/server-components.md",
      title: "server-components.md",
      summary: "Next.js 服务端组件的使用原则和最佳实践，包括 Server/Client Component 的边界划分。",
      loadWhen: "需要决定 UI 组件使用 Server Component 还是 Client Component，或处理 RSC 边界时读取。",
    }),
  ],
});
