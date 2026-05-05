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

### FAIL: 单 job 塞所有步骤

```yaml
all:
  script:
    - npm ci && npm run lint && npm test && npm run build && kubectl apply -f k8s/
  # 任何一步挂都显示同一个 job failed，无法定位
```

### PASS: 分 stage + needs 并行

```yaml
lint:   { stage: lint, script: [npm run lint] }
test:   { stage: test, needs: [lint], script: [npm test] }
build:  { stage: build, needs: [test], script: [npm run build],
          artifacts: { paths: [dist/] } }
deploy: { stage: deploy, needs: [build],
          rules: [{ if: '$CI_COMMIT_BRANCH == "main"', when: manual }] }
```

### FAIL: 生产自动部署无门禁

```yaml
deploy_prod:
  script: [kubectl apply -f k8s/]
  only: [main]  # 任何 push 自动上线
```

### PASS: 手动门禁 + 环境

```yaml
deploy_prod:
  environment: { name: production, url: https://app.example.com }
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual
  script: [kubectl apply -f k8s/]
```
