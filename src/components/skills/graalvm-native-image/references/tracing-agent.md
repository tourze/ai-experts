# GraalVM 追踪代理

使用 GraalVM 追踪代理自动收集原生镜像构建的可达性元数据的指南。

## 目录

1. [概述](#概述)
2. [运行追踪代理](#运行追踪代理)
3. [代理模式](#代理模式)
4. [与构建工具集成](#与构建工具集成)
5. [过滤与调优](#过滤与调优)

---

## 概述

GraalVM 追踪代理拦截应用在 JVM 上执行期间的所有动态访问（反射、资源、JNI、代理、序列化），并生成相应的 GraalVM metadata 文件。

**何时使用追踪代理：**
- 首次将复杂项目迁移到原生镜像
- 添加了具有反射需求的新库后
- 当手动 metadata 配置不足时
- 发现隐藏的反射/资源使用情况

**重要提示：** 代理仅捕获运行期间执行的代码路径。确保通过运行所有应用功能、端点和边缘情况来获得充分的覆盖。

## 运行追踪代理

### 基本用法

```bash
# 创建输出目录
mkdir -p src/main/resources/META-INF/native-image

# 使用追踪代理运行
java -agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image \
    -jar target/myapp.jar
```

然后，在优雅关闭前，运行所有应用功能（调用 API、触发定时任务等）。

### 配合 Spring Boot

```bash
# 使用追踪代理运行 Spring Boot 应用
java -agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image \
    -jar target/myapp.jar

# 运行所有端点
curl http://localhost:8080/api/users
curl -X POST http://localhost:8080/api/users -H 'Content-Type: application/json' -d '{"name":"test"}'
curl http://localhost:8080/actuator/health

# 优雅关闭（Ctrl+C 或 kill -SIGTERM）
```

### 合并到现有配置

```bash
# 将代理输出与现有 metadata 合并（不会覆盖）
java -agentlib:native-image-agent=config-merge-dir=src/main/resources/META-INF/native-image \
    -jar target/myapp.jar
```

## 代理模式

### 输出模式（新配置）

写入新配置，覆盖任何现有文件：

```bash
-agentlib:native-image-agent=config-output-dir=<path>
```

### 合并模式（追加到现有）

将新条目合并到现有配置文件中：

```bash
-agentlib:native-image-agent=config-merge-dir=<path>
```

### 条件模式

生成条件 metadata（仅当类型可达时才包含）：

```bash
-agentlib:native-image-agent=config-output-dir=<path>,experimental-conditional-config-filter-file=filter.json
```

## 与构建工具集成

### Maven — 在测试期间运行代理

```xml
<profiles>
  <profile>
    <id>agent</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.graalvm.buildtools</groupId>
          <artifactId>native-maven-plugin</artifactId>
          <configuration>
            <agent>
              <enabled>true</enabled>
              <options>
                <option>config-output-dir=src/main/resources/META-INF/native-image</option>
              </options>
            </agent>
          </configuration>
        </plugin>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-surefire-plugin</artifactId>
          <configuration>
            <argLine>-agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image</argLine>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

使用以下命令运行：

```bash
./mvnw -Pagent test
```

### Gradle — 在测试期间运行代理

```kotlin
graalvmNative {
    agent {
        defaultMode.set("standard")
        metadataCopy {
            inputTaskNames.add("test")
            outputDirectories.add("src/main/resources/META-INF/native-image")
            mergeWithExisting.set(true)
        }
    }
}
```

使用以下命令运行：

```bash
# 使用代理运行测试
./gradlew -Pagent test

# 复制收集到的 metadata
./gradlew metadataCopy
```

## 过滤与调优

### 代理过滤配置

创建过滤器文件以减少生成 metadata 中的噪声：

```json
{
  "rules": [
    {
      "excludeClasses": "jdk.internal.**"
    },
    {
      "excludeClasses": "sun.**"
    },
    {
      "excludeClasses": "com.sun.**"
    },
    {
      "includeClasses": "com.example.**"
    }
  ]
}
```

使用方式：

```bash
java -agentlib:native-image-agent=config-output-dir=<path>,caller-filter-file=filter.json \
    -jar target/myapp.jar
```

### 代理输出后处理

收集 metadata 后，审查和清理：

1. **移除不必要的条目** — 代理比较保守；许多条目可能不需要
2. **添加条件** — 使用 `condition.typeReached` 限制 metadata 的应用范围
3. **验证正确性** — 构建原生镜像并进行全面测试
4. **提交 metadata** — 将生成的文件添加到版本控制

### 推荐的工作流程

```bash
# 1. 使用代理运行测试以获取基线覆盖
./mvnw -Pagent test

# 2. 使用代理运行完整应用以获取运行时覆盖
java -agentlib:native-image-agent=config-merge-dir=src/main/resources/META-INF/native-image \
    -jar target/myapp.jar
# 运行所有功能，然后关闭

# 3. 构建原生镜像
./mvnw -Pnative package

# 4. 测试原生可执行文件
./target/myapp

# 5. 如果出现失败，使用额外的代码路径重复步骤 2-4
```
