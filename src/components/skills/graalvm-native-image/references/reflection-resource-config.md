# GraalVM 反射与资源配置

在原生镜像中启用反射、资源、代理和序列化的 GraalVM metadata 文件完整指南。

## 目录

1. [配置文件位置](#配置文件位置)
2. [统一可达性元数据](#统一可达性元数据)
3. [反射配置](#反射配置)
4. [资源配置](#资源配置)
5. [代理配置](#代理配置)
6. [序列化配置](#序列化配置)

---

## 配置文件位置

将 metadata 文件放置在：

```
src/main/resources/
  META-INF/native-image/
    <group.id>/
      <artifact.id>/
        reachability-metadata.json    # 统一格式（推荐）
        reflect-config.json           # 旧版：仅反射
        resource-config.json          # 旧版：仅资源
        proxy-config.json             # 旧版：动态代理
        serialization-config.json     # 旧版：序列化
        jni-config.json               # 旧版：JNI 访问
        native-image.properties       # 构建参数
```

GraalVM 会自动发现 `META-INF/native-image/` 目录中的文件。

## 统一可达性元数据

统一的 `reachability-metadata.json` 格式（推荐 GraalVM 23+ 使用）合并所有 metadata：

```json
{
  "reflection": [
    {
      "type": "com.example.dto.UserDto",
      "allDeclaredConstructors": true,
      "allDeclaredMethods": true,
      "allDeclaredFields": true
    },
    {
      "condition": {
        "typeReached": "com.example.service.OrderService"
      },
      "type": "com.example.dto.OrderDto",
      "methods": [
        {"name": "<init>", "parameterTypes": []},
        {"name": "getId", "parameterTypes": []},
        {"name": "setId", "parameterTypes": ["java.lang.Long"]}
      ],
      "fields": [
        {"name": "id"},
        {"name": "status"}
      ]
    }
  ],
  "resources": [
    {"glob": "application.yml"},
    {"glob": "application-*.yml"},
    {"glob": "templates/**/*.html"},
    {"glob": "static/**"},
    {"glob": "META-INF/services/*"}
  ],
  "bundles": [
    {"name": "messages", "locales": ["en", "it", "de"]}
  ],
  "jni": [
    {
      "type": "com.example.NativeHelper",
      "methods": [
        {"name": "nativeMethod", "parameterTypes": ["int"]}
      ]
    }
  ]
}
```

## 反射配置

### 旧版 `reflect-config.json`

```json
[
  {
    "name": "com.example.dto.UserDto",
    "allDeclaredConstructors": true,
    "allPublicConstructors": true,
    "allDeclaredMethods": true,
    "allPublicMethods": true,
    "allDeclaredFields": true,
    "allPublicFields": true
  },
  {
    "name": "com.example.dto.OrderDto",
    "methods": [
      {"name": "<init>", "parameterTypes": []},
      {"name": "<init>", "parameterTypes": ["java.lang.Long", "java.lang.String"]},
      {"name": "getId", "parameterTypes": []},
      {"name": "setId", "parameterTypes": ["java.lang.Long"]}
    ],
    "fields": [
      {"name": "id", "allowWrite": true},
      {"name": "status", "allowWrite": true}
    ]
  },
  {
    "name": "com.example.entity.Product",
    "allDeclaredConstructors": true,
    "allDeclaredMethods": true,
    "allDeclaredFields": true,
    "unsafeAllocated": true
  }
]
```

### 常用反射标志

| 标志 | 描述 |
|------|-------------|
| `allDeclaredConstructors` | 注册所有构造器（公共和私有） |
| `allPublicConstructors` | 仅注册公共构造器 |
| `allDeclaredMethods` | 注册所有方法（公共和私有） |
| `allPublicMethods` | 仅注册公共方法 |
| `allDeclaredFields` | 注册所有字段（公共和私有） |
| `allPublicFields` | 仅注册公共字段 |
| `unsafeAllocated` | 允许 `Unsafe.allocateInstance()` |

## 资源配置

### 旧版 `resource-config.json`

```json
{
  "resources": {
    "includes": [
      {"pattern": "application\\.yml"},
      {"pattern": "application-.*\\.yml"},
      {"pattern": "logback\\.xml"},
      {"pattern": "logback-spring\\.xml"},
      {"pattern": "META-INF/services/.*"},
      {"pattern": "templates/.*\\.html"},
      {"pattern": "static/.*"},
      {"pattern": "db/migration/.*\\.sql"}
    ],
    "excludes": [
      {"pattern": ".*\\.DS_Store"}
    ]
  },
  "bundles": [
    {"name": "messages", "locales": ["en", "it"]},
    {"name": "ValidationMessages"}
  ]
}
```

## 代理配置

### 旧版 `proxy-config.json`

注册用于 JDK 动态代理生成的接口：

```json
[
  {
    "interfaces": [
      "com.example.service.UserService",
      "org.springframework.aop.SpringProxy",
      "org.springframework.aop.framework.Advised",
      "org.springframework.core.DecoratingProxy"
    ]
  },
  {
    "interfaces": [
      "com.example.repository.OrderRepository",
      "org.springframework.data.repository.Repository"
    ]
  }
]
```

## 序列化配置

### 旧版 `serialization-config.json`

```json
{
  "types": [
    {"name": "com.example.dto.UserDto"},
    {"name": "com.example.dto.OrderDto"},
    {"name": "java.util.ArrayList"},
    {"name": "java.util.HashMap"}
  ],
  "lambdaCapturingTypes": [
    {"name": "com.example.service.UserService"}
  ]
}
```

## `native-image.properties`

配置默认构建参数：

```properties
Args = --no-fallback \
       -H:+ReportExceptionStackTraces \
       --enable-https \
       --initialize-at-build-time=org.slf4j
```
