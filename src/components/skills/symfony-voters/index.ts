import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { doctrineBatchProcessingSkill } from "../doctrine-batch-processing/index";
import { symfonyMessengerSkill } from "../symfony-messenger/index";

export const symfonyVotersSkill = defineSkill({
  id: "symfony-voters",
  fullName: "Symfony Voters",
  description: "当用户要设计或修复 Symfony Voter 授权逻辑、IsGranted 属性或权限决策矩阵时使用。",
  useCases: [
    "需要新增、收敛或审查 Symfony Voter、`#[IsGranted]`、`denyAccessUnlessGranted()` 等授权逻辑。",
    "权限判断散落在 Controller、Service、Twig 模板和仓储层，导致规则漂移。",
    "需要把“谁能对什么资源执行什么动作”固化为明确的决策矩阵。",
    "如果授权后的动作会投递异步消息，可联动 `symfony-messenger`；如果授权绑定 ORM 资源加载，可联动 `doctrine-batch-processing`。",
    "更细的验证命令读取 `authorization-reference`。",
  ],
  constraints: [
    "默认拒绝：属性不支持、主体为空或资源类型错误时，必须明确走拒绝路径。",
    "授权只回答“能不能做”，不要把完整业务流程塞进 Voter。",
    "资源加载、授权判断、错误响应三层职责要分开，避免既查库又改状态。",
    "不要通过错误消息泄露敏感上下文，例如“资源存在但你无权访问”这类差异。",
    "控制器、API Platform、Twig 模板和命令入口必须复用同一套授权事实，而不是各写一份 if/else。",
  ],
  checklist: [
    "是否先画清楚“操作者 / 资源 / 动作”的决策矩阵，再写代码。",
    "`supports()` 是否足够收敛，避免把不相关的 subject 吃进去。",
    "拒绝路径是否稳定且默认安全，没有把敏感原因暴露给前端。",
    "Controller、模板和 API 入口是否共用同一授权属性，而不是分叉实现。",
    "是否覆盖匿名用户、普通用户、资源所有者、管理员和资源不存在等测试场景。",
  ],
  relatedSkills: [
    {
      get id() {
        return doctrineBatchProcessingSkill.id;
      },
      reason: "授权依赖 ORM 资源加载、批量资源过滤或 Doctrine 查询边界时联动。",
    },
    {
      get id() {
        return symfonyMessengerSkill.id;
      },
      reason: "授权后的动作会投递异步消息、触发 Handler 或失败队列时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Controller 手写角色判断",
      pass: "Voter 集中决策",
    }),
    defineAntiPattern({
      fail: "Voter 里产生副作用",
      pass: "Voter 保持纯判断",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先画清操作者、资源、动作和入口，默认拒绝匿名、空 subject、不支持属性和错误资源类型。",
      "Voter 只回答能不能做，不执行查询、状态修改或完整业务流程。",
      "Controller、API Platform、Twig 和命令入口复用同一授权属性，避免权限漂移。",
      "PostVoter、控制器和 Twig 示例读取 `voter-patterns`；测试与验证命令读取 `authorization-reference`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "操作者 / 资源 / 动作决策矩阵和授权入口列表。",
      "Voter supports / voteOnAttribute、Controller、Twig 和 API 复用建议。",
      "匿名、所有者、管理员、资源不存在和拒绝信息泄露测试建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "voter-patterns",
      source: new URL("./references/voter-patterns.md", import.meta.url),
      target: "references/voter-patterns.md",
      title: "Symfony Voter 代码模式",
      summary: "PostVoter、控制器 denyAccessUnlessGranted 和 Twig is_granted 示例。",
      loadWhen: "需要快速实现 Symfony Voter 或入口授权代码时读取。",
    }),
    defineReference({
      id: "authorization-reference",
      source: new URL("./references/authorization-reference.md", import.meta.url),
      target: "references/authorization-reference.md",
      title: "Symfony Voter 授权参考",
      summary: "Voter 完整示例、控制器集成、模板集成、测试建议、验证命令和失败模式。",
      loadWhen: "需要完整 Symfony Voter 授权实现、测试矩阵或验证命令时读取。",
    }),
  ],
});
