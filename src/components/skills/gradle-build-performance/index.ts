import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const gradleBuildPerformanceSkill = defineSkill({
  id: "gradle-build-performance",
  fullName: "Gradle 构建性能",
  description: "当 Gradle 构建变慢、需要排查配置阶段或执行阶段瓶颈时使用。",
  useCases: [
    "`clean build`、增量构建或 CI 构建明显变慢。",
    "需要判断瓶颈在配置阶段、任务执行阶段还是依赖解析阶段。",
    "想启用 Configuration Cache、Build Cache、并行构建或迁移 `kapt` 到 `ksp`。",
    "Native Image 构建链路过慢时，可与 [graalvm-native-image](../graalvm-native-image/SKILL.md) 配合使用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
