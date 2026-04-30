# java-expert

Java 开发专家能力，覆盖 Java 21 / Spring Boot 3.x 开发规范、JUnit 5 测试、Arthas 排障、GraalVM Native Image 与 Gradle 构建优化，并在 `Edit|Write` 后执行 Java 相关守卫。

## Skills

| Skill | 用途 |
|-------|------|
| `spring-boot-layering` | Spring Boot 3.x 分层（Controller/Service/Repository）+ DTO/事务/异常处理 |
| `java-junit` | JUnit 5 单元测试最佳实践（含数据驱动测试） |
| `arthas-cpu-high` | JVM/应用 CPU 飙高排查（线程定位 + 代码路径） |
| `arthas-springcontext-issues-resolve` | Spring ApplicationContext/Bean 配置问题诊断 |
| `graalvm-native-image` | GraalVM Native Image 构建指南 |
| `gradle-build-performance` | Android/Gradle 构建性能调试与优化 |

## Agents

| Agent | 用途 |
|-------|------|
| `java-reviewer` | perform a Java-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-java` | javac 语法检查（回退括号配对检测） |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | System.out.print / printStackTrace 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find plugins/java-expert -type f \( -name '*.mjs' -o -name '*.cjs' \) -print0 | xargs -0 -I{} node --check "{}"
node --test plugins/java-expert/tests/*.mjs
```
