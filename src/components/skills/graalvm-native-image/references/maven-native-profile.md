# Maven Native Build Tools 配置

使用 Native Build Tools 插件构建 GraalVM native image 的完整 Maven 配置。

## 目录

1. [Native Profile 设置](#native-profile-设置)
2. [插件配置选项](#插件配置选项)
3. [Spring Boot Maven 集成](#spring-boot-maven-集成)
4. [在 Native 模式下测试](#在-native-模式下测试)
5. [多模块项目](#多模块项目)

---

## Native Profile 设置

在 `pom.xml` 中添加 `native` profile，将原生特定配置分离出来：

```xml
<profiles>
  <profile>
    <id>native</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.graalvm.buildtools</groupId>
          <artifactId>native-maven-plugin</artifactId>
          <version>0.10.6</version>
          <extensions>true</extensions>
          <executions>
            <execution>
              <id>build-native</id>
              <goals>
                <goal>compile-no-fork</goal>
              </goals>
              <phase>package</phase>
            </execution>
            <execution>
              <id>test-native</id>
              <goals>
                <goal>test</goal>
              </goals>
              <phase>test</phase>
            </execution>
          </executions>
          <configuration>
            <imageName>${project.artifactId}</imageName>
            <mainClass>${exec.mainClass}</mainClass>
            <buildArgs>
              <buildArg>--no-fallback</buildArg>
              <buildArg>-H:+ReportExceptionStackTraces</buildArg>
            </buildArgs>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

## 插件配置选项

### 常见构建参数

```xml
<configuration>
  <imageName>${project.artifactId}</imageName>
  <mainClass>com.example.Application</mainClass>
  <fallback>false</fallback>
  <verbose>true</verbose>
  <buildArgs>
    <!-- 禁用回退到 JVM -->
    <buildArg>--no-fallback</buildArg>
    <!-- 报告异常堆栈跟踪 -->
    <buildArg>-H:+ReportExceptionStackTraces</buildArg>
    <!-- 增加构建内存 -->
    <buildArg>-J-Xmx8g</buildArg>
    <!-- 启用 HTTPS 支持 -->
    <buildArg>--enable-https</buildArg>
    <!-- 快速构建模式（仅开发，运行时更慢） -->
    <buildArg>-Ob</buildArg>
    <!-- 包含所有匹配模式的资源 -->
    <buildArg>-H:IncludeResources=application.*</buildArg>
  </buildArgs>
  <!-- GraalVM metadata 仓库支持 -->
  <metadataRepository>
    <enabled>true</enabled>
  </metadataRepository>
</configuration>
```

### Metadata 仓库集成

GraalVM Reachability Metadata Repository 为流行库提供预构建的 metadata：

```xml
<configuration>
  <metadataRepository>
    <enabled>true</enabled>
    <version>0.3.14</version>
  </metadataRepository>
</configuration>
```

## Spring Boot Maven 集成

对于 Spring Boot 3.x 项目，父 POM 包含一个 `native` profile。与 Spring Boot Maven Plugin 结合使用：

```xml
<profiles>
  <profile>
    <id>native</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-maven-plugin</artifactId>
          <executions>
            <execution>
              <id>process-aot</id>
              <goals>
                <goal>process-aot</goal>
              </goals>
            </execution>
          </executions>
        </plugin>
        <plugin>
          <groupId>org.graalvm.buildtools</groupId>
          <artifactId>native-maven-plugin</artifactId>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

构建命令：

```bash
# 编译为原生可执行文件
./mvnw -Pnative native:compile

# 使用 Cloud Native Buildpacks 构建 OCI 镜像
./mvnw -Pnative spring-boot:build-image

# 仅运行 AOT 处理（用于调试）
./mvnw -Pnative process-aot
```

## 在 Native 模式下测试

运行编译为原生可执行文件的 JUnit 测试：

```bash
# 运行原生测试
./mvnw -Pnative test

# 或显式指定
./mvnw -Pnative native:test
```

配置测试特定设置：

```xml
<execution>
  <id>test-native</id>
  <goals>
    <goal>test</goal>
  </goals>
  <phase>test</phase>
  <configuration>
    <buildArgs>
      <buildArg>-H:+ReportExceptionStackTraces</buildArg>
      <buildArg>--no-fallback</buildArg>
    </buildArgs>
  </configuration>
</execution>
```

## 多模块项目

对于多模块 Maven 项目，在生成可执行文件的模块中配置原生插件：

```xml
<!-- 父级 pom.xml -->
<pluginManagement>
  <plugins>
    <plugin>
      <groupId>org.graalvm.buildtools</groupId>
      <artifactId>native-maven-plugin</artifactId>
      <version>0.10.6</version>
    </plugin>
  </plugins>
</pluginManagement>

<!-- 子模块 pom.xml（可执行模块） -->
<profiles>
  <profile>
    <id>native</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.graalvm.buildtools</groupId>
          <artifactId>native-maven-plugin</artifactId>
          <configuration>
            <imageName>${project.artifactId}</imageName>
            <mainClass>com.example.Application</mainClass>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```
