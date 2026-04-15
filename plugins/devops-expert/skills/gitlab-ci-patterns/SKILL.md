---
name: gitlab-ci-patterns
description: 当用户要设计、优化或排查 GitLab CI/CD 流水线时使用。
---

# GitLab CI/CD 模式

## 适用场景
- 新建或重构 `.gitlab-ci.yml`。
- 优化多阶段流水线的执行顺序、缓存和制品传递。
- 设计从构建到部署的 GitLab Runner 流程。

## 核心约束
- 优先使用 `rules:` 和 `needs:`，避免继续扩散遗留的 `only/except` 写法。
- 基础镜像尽量固定版本，避免流水线漂移。
- 凭据只能来自 GitLab CI Variables、Vault 或外部密钥系统。
- 生产部署必须显式标记人工门禁或受保护分支。

## 代码模式
- 基础流水线骨架：

```yaml
stages:
  - lint
  - test
  - build
  - deploy

default:
  image: node:20-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .npm/

lint:
  stage: lint
  script:
    - npm ci --cache .npm
    - npm run lint

test:
  stage: test
  needs: ["lint"]
  script:
    - npm ci --cache .npm
    - npm test -- --runInBand

build:
  stage: build
  needs: ["test"]
  script:
    - npm ci --cache .npm
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day

deploy_production:
  stage: deploy
  needs: ["build"]
  image: bitnami/kubectl:1.32
  script:
    - kubectl apply -f k8s/
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual
```

- Helm 或 Kubernetes 发布可以衔接 [helm-chart-scaffolding](../helm-chart-scaffolding/SKILL.md)。

## 检查清单
- 是否明确 stage 顺序、`needs` 依赖和并行边界。
- 是否区分缓存、制品和部署产物的生命周期。
- 是否固定基础镜像版本，并限制 privileged runner 使用范围。
- 是否为发布作业设置环境、审批和受保护分支条件。
- 是否记录失败后需要保留的日志、报告和测试产物。

## 反模式
- 把全部任务塞进单个 job，失去并行和失败定位能力。
- 对不同分支复用同一个缓存 key，造成脏缓存。
- 在脚本里硬编码 registry 凭据或 kubeconfig。
- 对生产环境使用自动部署且没有门禁。
