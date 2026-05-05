## 核心约束
- 优先使用 `apiVersion: v2` 的 application chart。
- `values.yaml` 按镜像、网络、资源、安全、依赖项分层，避免扁平大表。
- Chart 中不要存放明文敏感值；机密优先交给外部 Secret 管理。
- 交付前至少运行 `helm lint` 与 [scripts/validate-chart.mjs](scripts/validate-chart.mjs)。

## 代码模式
- 初始化与校验：

```bash
helm create my-app
helm lint my-app
node scripts/validate-chart.mjs my-app
```

- `Chart.yaml` 最小骨架，可参考 [assets/Chart.yaml.template](assets/Chart.yaml.template)：

```yaml
apiVersion: v2
name: my-app
description: 我的服务 Helm Chart
type: application
version: 0.1.0
appVersion: "1.0.0"
```

- `values.yaml` 分层建议，可参考 [assets/values.yaml.template](assets/values.yaml.template)：

```yaml
image:
  repository: registry.example.com/my-app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

## 检查清单
- 是否保留 `Chart.yaml`、`values.yaml`、`templates/` 和必要的 `_helpers.tpl`。
- 是否为资源限制、探针、安全上下文和 ServiceAccount 提供默认值。
- 是否把环境差异下沉到 values 文件而不是复制模板。
- 是否验证依赖、渲染结果与 dry-run 安装路径。
- 如果 chart 暴露指标或 ServiceMonitor，参阅 [monitoring-observability](../monitoring-observability/SKILL.md)。
- 完整的 Chart 目录布局、values 模式、模板、钩子和依赖关系参考 [references/chart-structure.md](references/chart-structure.md)。

## 反模式

### FAIL: 模板里写死环境差异

```yaml
# templates/deployment.yaml
{{- if eq .Values.env "prod" }}
replicas: 10
{{- else if eq .Values.env "staging" }}
replicas: 3
{{- end }}
```

### PASS: 差异下沉到 values

```yaml
# templates/deployment.yaml
replicas: {{ .Values.replicaCount }}

# values-prod.yaml:  replicaCount: 10
# values-staging.yaml: replicaCount: 3
```

### FAIL: 明文 secret 进仓库

```yaml
database:
  password: "prod-db-password-123"  # 明文提交
```

### PASS: 外部 Secret 引用

```yaml
# values.yaml
database:
  passwordSecretRef: { name: db-credentials, key: password }

# templates/deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.database.passwordSecretRef.name }}
        key: {{ .Values.database.passwordSecretRef.key }}
```
