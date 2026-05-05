import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const arthasSpringcontextIssuesResolveSkill = defineSkill({
  id: "arthas-springcontext-issues-resolve",
  fullName: "Arthas Spring Context 排查",
  description: "当需要排查 Spring ApplicationContext、Bean 注册、条件装配或配置注入问题时使用。",
  useCases: [
    "Bean 找不到、注入到错误实现、`@Conditional` / `@Profile` 判断异常。",
    "线上环境配置值与预期不一致，需要确认属性来源。",
    "怀疑选错了 `ApplicationContext`、父子容器或类加载器。",
    "如果核心症状是 CPU 飙高而不是 Bean / 配置问题，转到 [arthas-cpu-high](../arthas-cpu-high/SKILL.md)。",
  ],
  constraints: [
    "优先只读查询：先用 `containsBean`、`getBeanNamesForType`、`Environment`，不要直接 `getBean()` 触发初始化副作用。",
    "严格限量：`vmtool -l` 必须给上限，任何批量输出都要截断。",
    "先确认上下文再查 Bean：多容器应用里，选错 `ApplicationContext` 会让后续结论全部失真。",
    "若使用 `--classLoader` / `--classLoaderClass`，必须先解释为什么当前类加载器不对。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
