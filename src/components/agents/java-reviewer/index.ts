import {
  AgentSandbox,
  defineAgent,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { springBootLayeringSkill } from "../../skills/spring-boot-layering/index";
import { javaJunitSkill } from "../../skills/java-junit/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { gradleBuildPerformanceSkill } from "../../skills/gradle-build-performance/index";
import { graalvmNativeImageSkill } from "../../skills/graalvm-native-image/index";
import { arthasCpuHighSkill } from "../../skills/arthas-cpu-high/index";
import { arthasSpringcontextIssuesResolveSkill } from "../../skills/arthas-springcontext-issues-resolve/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const javaReviewerAgent = defineAgent({
  id: "java-reviewer",
  description: "当需要执行 Java 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 Java 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: springBootLayeringSkill.id,
        label: "门禁 1",
        checks: "分层合规：Controller/Service/Repository 职责、构造器注入、@Transactional 位置",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: javaJunitSkill.id,
        label: "门禁 2",
        checks: "测试基线：JUnit 5 覆盖、Mockito 隔离、参数化测试",
      }),
      defineWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "route-spring-boot-layering",
        triggers: ["@Service", "@Component", "@Autowired", "new"],
        skill: springBootLayeringSkill.id,
        checks: "DI 方式、循环依赖、bean scope、分层违规",
        output: "分层审计",
      }),
      defineWorkflowRoute({
        id: "route-arthas-cpu-high",
        triggers: ["CPU 飙升", "负载异常", "线程栈"],
        skill: arthasCpuHighSkill.id,
        checks: "thread/cpu 分析、死锁检测、热点方法定位",
        output: "CPU 诊断报告",
      }),
      defineWorkflowRoute({
        id: "route-arthas-springcontext-issues-resolve",
        triggers: ["@Bean", "@Conditional"],
        skill: arthasSpringcontextIssuesResolveSkill.id,
        checks: "Bean 注册失败、条件装配误配置、上下文启动异常",
        output: "Context 诊断",
      }),
      defineWorkflowRoute({
        id: "route-gradle-build-performance",
        triggers: ["Gradle 构建慢", "依赖冲突"],
        skill: gradleBuildPerformanceSkill.id,
        checks: "配置阶段耗时、并行构建、依赖缓存、build scan",
        output: "构建优化建议",
      }),
      defineWorkflowRoute({
        id: "route-graalvm-native-image",
        triggers: ["native-image"],
        skill: graalvmNativeImageSkill.id,
        checks: "反射配置、序列化注册、资源包含、初始化策略",
        output: "Native Image 审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：spring-boot-layering → java-junit → 确认基线",
      }),
      defineWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配场景路由表，逐项深入",
      }),
      defineWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineWorkflowStep({
        id: "final-5",
        label: "排序：安全 > 正确性 > 影响面 > 执行成本",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供只读代码审查的通用方法论和检查清单。",
    },
    {
      id: springBootLayeringSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查分层合规性、DI 方式和事务边界。",
    },
    {
      id: javaJunitSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评估 JUnit 5 覆盖、Mockito 隔离和参数化测试质量。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供通用测试方法论，补充 Java 特有审查视角。",
    },
    {
      id: gradleBuildPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查构建配置瓶颈和依赖冲突。",
    },
    {
      id: graalvmNativeImageSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计反射配置和 Native Image 兼容性。",
    },
    {
      id: arthasCpuHighSkill.id,
      mode: SkillUseMode.Preload,
      reason: "识别 CPU 热点和线程栈异常。",
    },
    {
      id: arthasSpringcontextIssuesResolveSkill.id,
      mode: SkillUseMode.Preload,
      reason: "诊断 Bean 注册失败和条件装配问题。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
