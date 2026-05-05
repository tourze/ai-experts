import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
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
  constraints: [
    "文档必须以真实实现为准，字段名、状态值、校验规则和错误码不得猜测。",
    "简单 CRUD 可用简版模板，但复杂业务必须补齐业务背景、边界规则和测试场景。",
    "输出应直接落到 `.claude/docs/ai/<feature-name>/api-handoff.md` 或用户指定路径。",
    "不要把“后端如何实现”堆成源码讲解，前端只关心契约和集成行为。",
  ],
  checklist: [
    "是否覆盖所有前端会直接消费的接口和 DTO。",
    "是否明确鉴权、分页、排序、缓存、轮询或实时更新规则。",
    "是否写清错误码、字段约束和镜像到前端的校验逻辑。",
    "是否补充了联调测试场景和已知限制。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只贴 Swagger",
      pass: "Endpoint + 业务语义",
    }),
    defineAntiPattern({
      fail: "只 happy path",
      pass: "全状态码 + 边界",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
