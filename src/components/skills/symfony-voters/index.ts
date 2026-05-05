import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const symfonyVotersSkill = defineSkill({
  id: "symfony-voters",
  fullName: "Symfony Voters",
  description: "当用户要设计或修复 Symfony Voter 授权逻辑、IsGranted 属性或权限决策矩阵时使用。",
  useCases: [
    "需要新增、收敛或审查 Symfony Voter、`#[IsGranted]`、`denyAccessUnlessGranted()` 等授权逻辑。",
    "权限判断散落在 Controller、Service、Twig 模板和仓储层，导致规则漂移。",
    "需要把“谁能对什么资源执行什么动作”固化为明确的决策矩阵。",
    "如果授权后的动作会投递异步消息，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)；如果授权绑定 ORM 资源加载，可联动 [doctrine-batch-processing](../doctrine-batch-processing/SKILL.md)。",
    "更细的验证命令见 [reference.md](reference.md)。",
  ],
  constraints: [
    "默认拒绝：属性不支持、主体为空或资源类型错误时，必须明确走拒绝路径。",
    "授权只回答“能不能做”，不要把完整业务流程塞进 Voter。",
    "资源加载、授权判断、错误响应三层职责要分开，避免既查库又改状态。",
    "不要通过错误消息泄露敏感上下文，例如“资源存在但你无权访问”这类差异。",
    "控制器、API Platform、Twig 模板和命令入口必须复用同一套授权事实，而不是各写一份 if/else。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
