import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { arthasCpuHighSkill } from "../arthas-cpu-high/index";

export const arthasSpringcontextIssuesResolveSkill = defineSkill({
  id: "arthas-springcontext-issues-resolve",
  fullName: "Arthas Spring Context 排查",
  description: "当需要排查 Spring ApplicationContext、Bean 注册、条件装配或配置注入问题时使用。",
  useCases: [
    "Bean 找不到、注入到错误实现、`@Conditional` / `@Profile` 判断异常。",
    "线上环境配置值与预期不一致，需要确认属性来源。",
    "怀疑选错了 `ApplicationContext`、父子容器或类加载器。",
  ],
  constraints: [
    "优先只读查询：先用 `containsBean`、`getBeanNamesForType`、`Environment`，不要直接 `getBean()` 触发初始化副作用。",
    "严格限量：`vmtool -l` 必须给上限，任何批量输出都要截断。",
    "先确认上下文再查 Bean：多容器应用里，选错 `ApplicationContext` 会让后续结论全部失真。",
    "若使用 `--classLoader` / `--classLoaderClass`，必须先解释为什么当前类加载器不对。",
  ],
  checklist: [
    "是否先确认拿到的是正确的 `ApplicationContext` 与类加载器。",
    "是否优先使用 `containsBean*` / `getBeanNamesForType`，避免提前初始化 Bean。",
    "如果属性值异常，是否同时给出了“值”和“来源”。",
    "如果出现多个候选 Bean，是否明确列出候选名并说明装配规则。",
    "如果 `ClassNotFound`，是否回溯到类加载器选择，而不是误判 Bean 不存在。",
  ],
  relatedSkills: [
    {
      get id() {
        return arthasCpuHighSkill.id;
      },
      reason: "核心症状是 JVM CPU 飙高、线程热点或负载异常而不是 Bean/配置问题时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "getBean 触发初始化",
      pass: "containsBean 只读检查",
    }),
    defineAntiPattern({
      fail: "只看 containsBean 不看容器",
      pass: "先确认容器再查 Bean",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用 `vmtool --action getInstances --className org.springframework.context.support.AbstractApplicationContext -l 5` 枚举上下文。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "确认 ApplicationContext 与类加载器后，再用 containsBean、containsBeanDefinition 或 getBeanNamesForType 做只读检查。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "查询配置值时通过 Environment 读取值和来源，避免只报值不报来源。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "多个候选 Bean 时列出候选名、类型、Profile/Conditional 条件和实际装配规则。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "ClassNotFound 或表达式失败时先回溯 classLoader/classLoaderClass 选择，不直接判定 Bean 不存在。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "ApplicationContext 实例、类加载器、父子容器和 vmtool 限量参数。",
      "Bean 是否存在、候选实现、装配规则、配置值及来源。",
      "只读查询命令、观察事实、推断结论和需要进一步确认的容器/类加载器问题。",
    ],
  }),
});
