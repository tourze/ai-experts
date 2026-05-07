import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { featureDevSkill } from "../feature-dev/index";
import { systemDesignSkill } from "../system-design/index";

export const backendToFrontendHandoffDocsSkill = defineSkill({
  id: "backend-to-frontend-handoff-docs",
  fullName: "backend-to-frontend-handoff-docs",
  description: "当后端接口完成后用户要为前端生成 API 交接材料、DTO 语义、状态码、校验规则或边界场景说明时使用。",
  useCases: [
    "适合接口开发完成后的交接、联调准备和 API 文档补齐。",
    "适合把散落在控制器、DTO、服务层和业务规则里的细节收敛成一份 handoff。",
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
  relatedSkills: [
    {
      get id() {
        return systemDesignSkill.id;
      },
      reason: "接口还处在方案设计或系统边界讨论阶段时先联动。",
    },
    {
      get id() {
        return featureDevSkill.id;
      },
      reason: "接口尚未落地、还需要实现或补齐开发任务时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先从控制器、路由、DTO、服务层、错误码和鉴权配置收集事实；缺失信息标为待确认。",
      "按业务背景、Endpoints、DTO、枚举常量、校验规则、业务边界、集成建议组织正文。",
      "复杂业务必须补 JSON 请求/响应形状、字段说明、错误码、分页/排序/缓存/轮询或实时更新规则。",
      "输出到 `.claude/docs/ai/<feature-name>/api-handoff.md` 或用户指定路径，并注明联调测试场景和已知限制。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "API handoff Markdown，覆盖业务背景、接口列表、DTO、枚举、校验、错误码和边界条件。",
      "可复制的 JSON 示例、字段语义说明、前端需要镜像的校验逻辑和鉴权/状态规则。",
      "联调检查项、测试场景、待确认问题和文档落地路径。",
    ],
  }),
});
