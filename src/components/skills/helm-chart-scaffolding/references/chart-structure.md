# Helm Chart 结构参考

Helm Chart 组织编排、文件约定和最佳实践的完整指南。

## 标准 Chart 目录结构

```
my-app/
├── Chart.yaml              # Chart 元数据（必需）
├── Chart.lock              # 依赖锁定文件（生成）
├── values.yaml             # 默认配置值（必需）
├── values.schema.json      # value 校验的 JSON Schema
├── .helmignore             # 打包时忽略的模式
├── README.md               # Chart 文档
├── LICENSE                 # Chart 许可证
├── charts/                 # Chart 依赖（打包）
│   └── postgresql-12.0.0.tgz
├── crds/                   # 自定义资源定义
│   └── my-crd.yaml
├── templates/              # Kubernetes 清单模板（必需）
│   ├── NOTES.txt          # 安装后指引
│   ├── _helpers.tpl       # 模板辅助函数
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── serviceaccount.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── networkpolicy.yaml
│   └── tests/
│       └── test-connection.yaml
└── files/                  # 额外包含的文件
    └── config/
        └── app.conf
```

## Chart.yaml 规范

### API 版本 v2（Helm 3+）

```yaml
apiVersion: v2 # 必需：API 版本
name: my-application # 必需：Chart 名称
version: 1.2.3 # 必需：Chart 版本（SemVer）
appVersion: "2.5.0" # 应用版本
description: A Helm chart for my application # 必需
type: application # Chart 类型：application 或 library
keywords: # 搜索关键词
  - web
  - api
  - backend
home: https://example.com # 项目主页
sources: # 源码 URL
  - https://github.com/example/my-app
maintainers: # 维护者列表
  - name: John Doe
    email: john@example.com
    url: https://github.com/johndoe
icon: https://example.com/icon.png # Chart 图标 URL
kubeVersion: ">=1.24.0" # 兼容的 Kubernetes 版本
deprecated: false # 标记为已废弃
annotations: # 任意注解
  example.com/release-notes: https://example.com/releases/v1.2.3
dependencies: # Chart 依赖
  - name: postgresql
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
    tags:
      - database
    import-values:
      - child: database
        parent: database
    alias: db
```

## Chart 类型

### Application Chart

```yaml
type: application
```

- 标准 Kubernetes 应用
- 可安装和管理
- 包含 K8s 资源模板

### Library Chart

```yaml
type: library
```

- 共享模板辅助函数
- 不能直接安装
- 作为其他 chart 的依赖使用
- 无 templates/ 目录

## Values 文件组织

### values.yaml（默认值）

```yaml
# 全局值（与子 chart 共享）
global:
  imageRegistry: docker.io
  imagePullSecrets: []

# 镜像配置
image:
  registry: docker.io
  repository: myapp/web
  tag: "" # 默认为 .Chart.AppVersion
  pullPolicy: IfNotPresent

# 部署设置
replicaCount: 1
revisionHistoryLimit: 10

# Pod 配置
podAnnotations: {}
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

# 容器安全
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

# 服务
service:
  type: ClusterIP
  port: 80
  targetPort: http
  annotations: {}

# 资源
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

# 自动扩缩容
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80

# 节点选择
nodeSelector: {}
tolerations: []
affinity: {}

# 监控
serviceMonitor:
  enabled: false
  interval: 30s
```

### values.schema.json（校验）

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1
    },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      }
    }
  },
  "required": ["image"]
}
```

## 模板文件

### 模板命名约定

- **小写加连字符**：`deployment.yaml`、`service-account.yaml`
- **局部模板**：以下划线开头 `_helpers.tpl`
- **测试**：放在 `templates/tests/`
- **CRD**：放在 `crds/`（不经过模板化）

### 常见模板

#### \_helpers.tpl

```yaml
{{/*
标准命名辅助函数
*/}}
{{- define "my-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "my-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
通用标签
*/}}
{{- define "my-app.labels" -}}
helm.sh/chart: {{ include "my-app.chart" . }}
{{ include "my-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "my-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
镜像名称辅助函数
*/}}
{{- define "my-app.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry -}}
{{- $repository := .Values.image.repository -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end -}}
```

#### NOTES.txt

```
感谢安装 {{ .Chart.Name }}。

您的 release 名为 {{ .Release.Name }}。

想了解更多关于此 release 的信息，请尝试：

  $ helm status {{ .Release.Name }}
  $ helm get all {{ .Release.Name }}

{{- if .Values.ingress.enabled }}

应用 URL：
{{- range .Values.ingress.hosts }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .host }}{{ .path }}
{{- end }}
{{- else }}

通过以下命令获取应用 URL：
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "my-app.name" . }}" -o jsonpath="{.items[0].metadata.name}")
  kubectl port-forward $POD_NAME 8080:80
  echo "访问 http://127.0.0.1:8080"
{{- end }}
```

## 依赖管理

### 声明依赖

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled # 通过 values 启用/禁用
    tags: # 依赖分组
      - database
    import-values: # 从子 chart 导入值
      - child: database
        parent: database
    alias: db # 引用为 .Values.db
```

### 管理依赖

```bash
# 更新依赖
helm dependency update

# 列出依赖
helm dependency list

# 构建依赖
helm dependency build
```

### Chart.lock

由 `helm dependency update` 自动生成：

```yaml
dependencies:
  - name: postgresql
    repository: https://charts.bitnami.com/bitnami
    version: 12.0.0
digest: sha256:abcd1234...
generated: "2024-01-01T00:00:00Z"
```

## .helmignore

从 chart 包中排除的文件：

```
# 开发文件
.git/
.gitignore
*.md
docs/

# 构建产物
*.swp
*.bak
*.tmp
*.orig

# CI/CD
.travis.yml
.gitlab-ci.yml
Jenkinsfile

# 测试
test/
*.test

# IDE
.vscode/
.idea/
*.iml
```

## 自定义资源定义（CRD）

将 CRD 放在 `crds/` 目录：

```
crds/
├── my-app-crd.yaml
└── another-crd.yaml
```

**重要 CRD 说明：**

- CRD 在任何模板之前安装
- CRD 不经过模板化（无 `{{ }}` 语法）
- CRD 不会随 chart 升级或删除
- 使用 `helm install --skip-crds` 跳过安装

## Chart 版本管理

### 语义化版本

- **Chart 版本**：Chart 变化时递增
  - MAJOR：破坏性变更
  - MINOR：新功能，向后兼容
  - PATCH：Bug 修复

- **App 版本**：部署的应用版本
  - 可以是任意字符串
  - 不要求遵循 SemVer

```yaml
version: 2.3.1 # Chart 版本
appVersion: "1.5.0" # 应用版本
```

## Chart 测试

### 测试文件

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "my-app.fullname" . }}-test-connection"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
  - name: wget
    image: busybox
    command: ['wget']
    args: ['{{ include "my-app.fullname" . }}:{{ .Values.service.port }}']
  restartPolicy: Never
```

### 运行测试

```bash
helm test my-release
helm test my-release --logs
```

## Hooks

Helm hooks 允许在特定点进行干预：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-migration
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

### Hook 类型

- `pre-install`：模板渲染前
- `post-install`：所有资源加载后
- `pre-delete`：任何资源删除前
- `post-delete`：所有资源删除后
- `pre-upgrade`：升级前
- `post-upgrade`：升级后
- `pre-rollback`：回滚前
- `post-rollback`：回滚后
- `test`：通过 `helm test` 运行

### Hook 权重

控制 hook 执行顺序（-5 到 5，越小越先执行）

### Hook 删除策略

- `before-hook-creation`：创建新 hook 前删除旧 hook
- `hook-succeeded`：成功执行后删除
- `hook-failed`：hook 失败时删除

## 最佳实践

1. **使用辅助函数**处理重复模板逻辑
2. **在模板中对字符串加引号**：`{{ .Values.name | quote }}`
3. **使用 values.schema.json 校验值**
4. **在 values.yaml 中记录所有值**
5. **对 chart 版本使用语义化版本**
6. **精确锁定依赖版本**
7. **包含 NOTES.txt**并提供使用说明
8. **为关键功能添加测试**
9. **使用 hooks 处理数据库迁移**
10. **保持 chart 聚焦**——每个 chart 对应一个应用

## Chart 仓库结构

```
helm-charts/
├── index.yaml
├── my-app-1.0.0.tgz
├── my-app-1.1.0.tgz
├── my-app-1.2.0.tgz
└── another-chart-2.0.0.tgz
```

### 创建仓库索引

```bash
helm repo index . --url https://charts.example.com
```

## 相关资源

- [Helm 文档](https://helm.sh/docs/)
- [Chart 模板指南](https://helm.sh/docs/chart_template_guide/)
- [最佳实践](https://helm.sh/docs/chart_best_practices/)
