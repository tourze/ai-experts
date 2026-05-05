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
