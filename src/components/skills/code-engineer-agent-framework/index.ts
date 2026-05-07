import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const codeEngineerAgentFrameworkSkill = defineSkill({
  id: "code-engineer-agent-framework",
  fullName: "Code Engineer Agent 框架",
  description: "当编写或维护可写代码实现类 engineer agent 时使用，提供跨语言实现门禁、写入边界、验证闭环和交付报告骨架。",
  useCases: [
    "当编写或维护可写代码实现类 engineer agent 时使用，提供跨语言实现门禁、写入边界、验证闭环和交付报告骨架。",
  ],
  constraints: [
    "默认只改用户目标直接相关的源码、测试、文档和必要项目配置。",
    "生产配置、密钥、证书、发布配置、部署脚本、依赖升级、数据库迁移和外部账户操作必须先确认。",
    "复杂改动必须先写清接口契约、数据流、错误路径、并发/事务边界和迁移影响。",
    "验证结果只报告真实执行过的命令；未执行、失败或无法执行必须单独列出。",
    "遇到用户已有未提交改动时先读 diff，在其基础上工作，不回滚无关改动。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标、范围、非目标、约束、验收标准和允许写入的位置。",
      "读取相关源码、配置、测试、调用点和同层实现，建立现状基线。",
      "复杂改动先设计再实现，明确接口契约、数据流、错误路径、并发/事务边界和迁移影响。",
      "按最小实现改动，只触达目标相关文件，不顺手重构无关代码。",
      "补测试或说明无需补测的理由，并运行相关测试、类型检查、lint 或构建。",
      "收尾报告必须区分已验证、未验证和已知风险；专项 engineer agent 追加语言/框架重点和最小验证命令。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "工程报告：现状评估、设计方案、实现变更、测试策略、验证结果、未覆盖项和风险。",
      "写入边界：允许修改文件、禁止触达区域、需要确认的依赖/迁移/生产动作。",
      "专项扩展：语言或框架关键实现维度、最小验证命令和需要确认后才能运行的命令。",
    ],
  }),
});
