import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const backendToFrontendHandoffDocsSkill = defineSkill({
  id: "backend-to-frontend-handoff-docs",
  fullName: "backend-to-frontend-handoff-docs",
  description: "当后端接口完成后用户要为前端生成 API 交接材料、DTO 语义、状态码、校验规则或边界场景说明时使用。",
  useCases: [
    "适合接口开发完成后的交接、联调准备和 API 文档补齐。",
    "适合把散落在控制器、DTO、服务层和业务规则里的细节收敛成一份 handoff。",
    "交叉引用：若还在做方案设计，先用 `system-design`；若接口尚未落地，先用 `feature-dev`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
