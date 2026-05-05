import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { gradleBuildPerformanceSkill } from "../gradle-build-performance/index";

export const graalvmNativeImageSkill = defineSkill({
  id: "graalvm-native-image",
  fullName: "GraalVM Native Image",
  description: "当需要构建或排障 GraalVM Native Image 时使用。",
  useCases: [
    "需要把 JVM 应用编译成原生可执行文件，以降低冷启动和内存占用。",
    "Native build 失败，报 `ClassNotFoundException`、反射、资源、代理或序列化相关错误。",
    "要为 Spring Boot、Quarkus、Micronaut 或纯 Java 项目补齐原生镜像配置。",
    "如果构建时间本身是主要问题，联动 `gradle-build-performance`。",
  ],
  constraints: [
    "先识别环境，再改配置：必须先确认构建工具、框架、Java 版本和失败日志，再决定 Maven/Gradle 路线。",
    "一次只修一个失败类别：先处理最早的原生构建错误，不要同时追加多份 metadata。",
    "元数据位置必须清晰：优先使用 `META-INF/native-image/<group>/<artifact>/` 下的配置。",
    "Spring Boot 3.x 优先 `RuntimeHints`；只有第三方库或无法代码注册时才退回 JSON metadata。",
    "若引用更细节的构建片段，直接跳到：\n[Maven Native Profile](references/maven-native-profile.md)、\n[Gradle Native Plugin](references/gradle-native-plugin.md)、\n[Spring Boot Native](references/spring-boot-native.md)、\n[Quarkus / Micronaut](references/quarkus-micronaut-native.md)、\n[Reflection / Resource Config](references/reflection-resource-config.md)、\n[Tracing Agent](references/tracing-agent.md)。",
  ],
  checklist: [
    "是否确认了 Java 版本、构建工具和框架种类。",
    "是否先跑出完整 native build 日志，并针对第一条阻断错误修复。",
    "是否区分了反射、资源、代理、序列化、JNI 这几类 reachability metadata。",
    "Spring Boot 项目是否优先评估 `RuntimeHints`，而不是先堆 JSON。",
    "构建成功后是否验证了启动、健康检查、启动时长和 RSS，而不只看“编译过了”。",
  ],
  relatedSkills: [
    {
      get id() {
        return gradleBuildPerformanceSkill.id;
      },
      reason: "如果构建时间本身是主要问题，联动 `gradle-build-performance`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用宽泛配置掩盖问题",
      pass: "精确到类",
    }),
    defineAntiPattern({
      fail: "不看日志就改配置",
      pass: "看第一条阻塞错误",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "gradle-native-plugin",
      source: new URL("./references/gradle-native-plugin.md", import.meta.url),
      target: "references/gradle-native-plugin.md",
      title: "gradle-native-plugin.md",
      summary: "Gradle 原生镜像插件配置：插件声明、构建参数与常见错误排查。",
      loadWhen: "Gradle 项目需要配置或排查 Native Image 构建时读取。",
    }),
    defineReference({
      id: "maven-native-profile",
      source: new URL("./references/maven-native-profile.md", import.meta.url),
      target: "references/maven-native-profile.md",
      title: "maven-native-profile.md",
      summary: "Maven 原生镜像配置：native profile 声明、参数传递与常见问题。",
      loadWhen: "Maven 项目需要配置或排查 Native Image 构建时读取。",
    }),
    defineReference({
      id: "quarkus-micronaut-native",
      source: new URL("./references/quarkus-micronaut-native.md", import.meta.url),
      target: "references/quarkus-micronaut-native.md",
      title: "quarkus-micronaut-native.md",
      summary: "Quarkus 与 Micronaut 框架的原生镜像配置要点与注意事项。",
      loadWhen: "Quarkus 或 Micronaut 项目需要构建原生镜像时读取。",
    }),
    defineReference({
      id: "reflection-resource-config",
      source: new URL("./references/reflection-resource-config.md", import.meta.url),
      target: "references/reflection-resource-config.md",
      title: "reflection-resource-config.md",
      summary: "Native Image 反射与资源配置：JSON metadata 与 RuntimeHints 的编写方式。",
      loadWhen: "需要补充反射、资源、代理或序列化的 reachability metadata 时读取。",
    }),
    defineReference({
      id: "spring-boot-native",
      source: new URL("./references/spring-boot-native.md", import.meta.url),
      target: "references/spring-boot-native.md",
      title: "spring-boot-native.md",
      summary: "Spring Boot 3.x 原生镜像配置：RuntimeHints 与 Maven/Gradle 集成。",
      loadWhen: "Spring Boot 项目需要构建原生镜像时读取。",
    }),
    defineReference({
      id: "tracing-agent",
      source: new URL("./references/tracing-agent.md", import.meta.url),
      target: "references/tracing-agent.md",
      title: "tracing-agent.md",
      summary: "Tracing Agent 使用方法：自动收集反射、资源与代理元数据的配置与输出。",
      loadWhen: "需要运行 Tracing Agent 自动收集原生镜像元数据时读取。",
    }),
  ],
});
