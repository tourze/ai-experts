import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const springBootLayeringSkill = defineSkill({
  id: "spring-boot-layering",
  fullName: "Spring Boot 分层模式",
  description: "当需要设计或审查 Spring Boot 3.x 分层（Controller/Service/Repository）、DTO 与 Entity 隔离、事务边界或 `@RestControllerAdvice` 异常处理时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for spring-boot-layering.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
