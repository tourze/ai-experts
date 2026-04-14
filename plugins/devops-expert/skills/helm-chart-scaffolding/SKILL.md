---
name: helm-chart-scaffolding
description: 当用户需要创建、重构或验证 Helm Chart 时使用，重点覆盖目录结构、values 分层、模板复用与发布校验。
---

# Helm Chart 搭建

## 适用场景
- 从零创建新的 Helm Chart。
- 把散落的 Kubernetes manifest 收敛到可复用 Chart。
- 需要为多环境部署整理 values 分层和依赖管理。
- 发布前做 `helm lint`、模板渲染与结构校验。

## 核心约束
- 优先使用 `apiVersion: v2` 的 application chart。
- `values.yaml` 按镜像、网络、资源、安全、依赖项分层，避免扁平大表。
- Chart 中不要存放明文敏感值；机密优先交给外部 Secret 管理。
- 交付前至少运行 `helm lint` 与 [scripts/validate-chart.sh](scripts/validate-chart.sh)。

## 代码模式
- 初始化与校验：

```bash
helm create my-app
helm lint my-app
bash scripts/validate-chart.sh my-app
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

## 反模式
- 把所有环境的差异直接写死在模板里。
- 使用模板函数拼接敏感值并把明文提交进仓库。
- 依赖版本不锁定，导致每次渲染结果漂移。
- 跳过渲染校验，只凭肉眼检查 YAML。
