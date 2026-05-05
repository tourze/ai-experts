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
