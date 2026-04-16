# java-expert

Java 开发专家插件，覆盖 Java 21 / Spring Boot 3.x 开发规范、JUnit 5 测试、Arthas 排障、GraalVM Native Image 与 Gradle 构建优化，并在 `Edit|Write` 后执行 Java 相关守卫。

## Skills

| Skill | 用途 |
|-------|------|
| `spring-boot-layering` | Spring Boot 3.x 分层（Controller/Service/Repository）+ DTO/事务/异常处理 |
| `java-junit` | JUnit 5 单元测试最佳实践（含数据驱动测试） |
| `arthas-cpu-high` | JVM/应用 CPU 飙高排查（线程定位 + 代码路径） |
| `arthas-springcontext-issues-resolve` | Spring ApplicationContext/Bean 配置问题诊断 |
| `graalvm-native-image` | GraalVM Native Image 构建指南 |
| `gradle-build-performance` | Android/Gradle 构建性能调试与优化 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-java` | javac 语法检查（回退括号配对检测） |
| PostToolUse Edit\|Write | `debug-statement-guard` | System.out.print / printStackTrace 检测 |
| PostToolUse Edit\|Write | `file-budget-guard` | Java 文件行数预算（800 行） |

如需通用 BOM / UTF-8 编码检查，请叠加安装 [coding-expert](../coding-expert/README.md)。

## 安装

```bash
claude --plugin-dir /path/to/plugins/java-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install java-expert@ai-experts
claude plugin install java-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall java-expert
claude plugin uninstall java-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
jq empty plugins/java-expert/.claude-plugin/plugin.json
jq empty plugins/java-expert/hooks/hooks.json
find plugins/java-expert -type f \( -name '*.mjs' -o -name '*.cjs' \) -print0 | xargs -0 -I{} node --check "{}"
node --test plugins/java-expert/tests/*.mjs
```
