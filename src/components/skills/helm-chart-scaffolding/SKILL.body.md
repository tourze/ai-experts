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
