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
