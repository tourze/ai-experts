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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
